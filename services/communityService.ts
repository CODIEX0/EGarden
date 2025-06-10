import { database } from '@/config/firebase';
import { ref, push, get, update, remove, query, orderByChild, limitToLast, startAt, endAt } from 'firebase/database';
import { CommunityPost, Comment, DonationItem, Review } from '@/types';
import { DatabaseService } from './databaseService';

export class CommunityService {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  // Community Posts
  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const post: Omit<CommunityPost, 'id'> = {
      ...postData,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isModerated: false,
    };

    return await this.dbService.create('communityPosts', post);
  }

  async getPosts(category?: string, limit: number = 20): Promise<CommunityPost[]> {
    try {
      const postsRef = ref(database, 'communityPosts');
      let postsQuery = query(postsRef, orderByChild('createdAt'), limitToLast(limit));
      
      if (category) {
        postsQuery = query(postsRef, orderByChild('category'), startAt(category), endAt(category), limitToLast(limit));
      }

      const snapshot = await get(postsQuery);
      if (snapshot.exists()) {
        const posts = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }));
        return posts.reverse(); // Most recent first
      }
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  async voteOnPost(postId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    try {
      const postRef = ref(database, `communityPosts/${postId}`);
      const voteRef = ref(database, `postVotes/${postId}/${userId}`);
      
      const [postSnapshot, voteSnapshot] = await Promise.all([
        get(postRef),
        get(voteRef)
      ]);

      if (!postSnapshot.exists()) {
        throw new Error('Post not found');
      }

      const post = postSnapshot.val();
      const existingVote = voteSnapshot.val();

      let upvoteChange = 0;
      let downvoteChange = 0;

      if (existingVote) {
        // Remove existing vote
        if (existingVote.type === 'up') upvoteChange -= 1;
        else downvoteChange -= 1;
        
        // If same vote type, just remove it
        if (existingVote.type === voteType) {
          await remove(voteRef);
          await update(postRef, {
            upvotes: post.upvotes + upvoteChange,
            downvotes: post.downvotes + downvoteChange,
          });
          return;
        }
      }

      // Add new vote
      if (voteType === 'up') upvoteChange += 1;
      else downvoteChange += 1;

      await Promise.all([
        update(voteRef, { type: voteType, timestamp: Date.now() }),
        update(postRef, {
          upvotes: post.upvotes + upvoteChange,
          downvotes: post.downvotes + downvoteChange,
        })
      ]);
    } catch (error) {
      console.error('Error voting on post:', error);
      throw error;
    }
  }

  async searchPosts(searchTerm: string, category?: string): Promise<CommunityPost[]> {
    try {
      const allPosts = await this.getPosts(category);
      return allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Comments
  async addComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'replies'>): Promise<string> {
    const comment: Omit<Comment, 'id'> = {
      ...commentData,
      upvotes: 0,
      downvotes: 0,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isModerated: false,
    };

    const commentId = await this.dbService.create('comments', comment);

    // Update post comment count
    const postRef = ref(database, `communityPosts/${commentData.postId}`);
    const postSnapshot = await get(postRef);
    if (postSnapshot.exists()) {
      const post = postSnapshot.val();
      await update(postRef, { commentCount: post.commentCount + 1 });
    }

    return commentId;
  }

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const commentsRef = ref(database, 'comments');
      const commentsQuery = query(commentsRef, orderByChild('postId'), startAt(postId), endAt(postId));
      
      const snapshot = await get(commentsQuery);
      if (snapshot.exists()) {
        const comments = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }));

        // Organize comments into nested structure
        const topLevelComments = comments.filter(c => !c.parentCommentId);
        const nestedComments = this.organizeNestedComments(comments);
        
        return nestedComments;
      }
      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  private organizeNestedComments(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const topLevel: Comment[] = [];

    // First pass: create map and identify top-level comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parentCommentId) {
        topLevel.push(commentMap.get(comment.id)!);
      }
    });

    // Second pass: nest replies
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id)!);
        }
      }
    });

    return topLevel.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Donations
  async createDonation(donationData: Omit<DonationItem, 'id' | 'createdAt' | 'status' | 'interestedUsers'>): Promise<string> {
    const donation: Omit<DonationItem, 'id'> = {
      ...donationData,
      status: 'available',
      interestedUsers: [],
      createdAt: new Date(),
    };

    return await this.dbService.create('donations', donation);
  }

  async getDonations(filters?: {
    category?: string;
    location?: string;
    search?: string;
    radius?: number;
  }, limit: number = 20): Promise<DonationItem[]> {
    try {
      let donations = await this.dbService.getAll('donations') as DonationItem[];
      
      if (filters) {
        if (filters.category) {
          donations = donations.filter(d => d.category === filters.category);
        }
        
        if (filters.location) {
          donations = donations.filter(d => 
            d.pickupLocation.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
            d.pickupLocation.state.toLowerCase().includes(filters.location!.toLowerCase())
          );
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          donations = donations.filter(d => 
            d.title.toLowerCase().includes(searchTerm) ||
            d.description.toLowerCase().includes(searchTerm) ||
            d.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }
      }

      return donations
        .filter(d => d.status === 'available' && new Date(d.availableUntil) > new Date())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching donations:', error);
      return [];
    }
  }

  async expressInterest(donationId: string, userId: string): Promise<void> {
    try {
      const donationRef = ref(database, `donations/${donationId}`);
      const snapshot = await get(donationRef);
      
      if (snapshot.exists()) {
        const donation = snapshot.val();
        const interestedUsers = donation.interestedUsers || [];
        
        if (!interestedUsers.includes(userId)) {
          interestedUsers.push(userId);
          await update(donationRef, { interestedUsers });
        }
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      throw error;
    }
  }

  async claimDonation(donationId: string, userId: string): Promise<void> {
    try {
      const donationRef = ref(database, `donations/${donationId}`);
      await update(donationRef, {
        status: 'claimed',
        claimedBy: userId,
      });
    } catch (error) {
      console.error('Error claiming donation:', error);
      throw error;
    }
  }

  async requestDonation(userId: string, donationId: string, message: string): Promise<void> {
    try {
      const requestData = {
        userId,
        donationId,
        message,
        timestamp: new Date(),
        status: 'pending',
      };
      await this.dbService.create('donationRequests', requestData);
      
      // Also add to interested users
      await this.expressInterest(donationId, userId);
    } catch (error) {
      console.error('Error requesting donation:', error);
      throw error;
    }
  }

  async markDonationCompleted(donationId: string): Promise<void> {
    try {
      const donationRef = ref(database, `donations/${donationId}`);
      await update(donationRef, {
        status: 'completed',
      });
    } catch (error) {
      console.error('Error marking donation completed:', error);
      throw error;
    }
  }

  // Reviews and Ratings
  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'helpful' | 'verified'>): Promise<string> {
    const review: Omit<Review, 'id'> = {
      ...reviewData,
      helpful: 0,
      verified: false,
      createdAt: new Date(),
    };

    return await this.dbService.create('reviews', review);
  }

  async getReviews(revieweeId: string): Promise<Review[]> {
    try {
      const reviewsRef = ref(database, 'reviews');
      const reviewsQuery = query(reviewsRef, orderByChild('revieweeId'), startAt(revieweeId), endAt(revieweeId));
      
      const snapshot = await get(reviewsQuery);
      if (snapshot.exists()) {
        return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  async calculateAverageRating(revieweeId: string): Promise<number> {
    try {
      const reviews = await this.getReviews(revieweeId);
      if (reviews.length === 0) return 0;
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Error calculating rating:', error);
      return 0;
    }
  }

  // Moderation
  async reportContent(contentType: 'post' | 'comment', contentId: string, reason: string, reporterId: string): Promise<void> {
    try {
      const report = {
        contentType,
        contentId,
        reason,
        reporterId,
        timestamp: new Date(),
        status: 'pending',
      };

      await this.dbService.create('reports', report);
    } catch (error) {
      console.error('Error reporting content:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm: string): Promise<any[]> {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }));

        return users.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.location.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limit results
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}

export const communityService = new CommunityService();
