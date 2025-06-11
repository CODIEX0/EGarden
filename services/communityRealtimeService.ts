import { database } from '@/config/firebase';
import { ref, push, get, update, remove, query, orderByChild, limitToLast, startAt, endAt, onValue, serverTimestamp } from 'firebase/database';
import { CommunityPost, Comment, Like, Follow, Notification } from '@/types';

interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class CommunityRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private notificationCallbacks: Set<(notification: Notification) => void> = new Set();

  // Real-time post updates
  subscribeToPosts(
    callback: (posts: CommunityPost[]) => void,
    filters?: { category?: string; userId?: string; following?: boolean }
  ): () => void {
    const subscriptionKey = `posts_${JSON.stringify(filters)}`;
    
    this.unsubscribeFromPosts(subscriptionKey);
    
    const postsRef = ref(database, 'communityPosts');
    const postsQuery = query(postsRef, orderByChild('createdAt'), limitToLast(50));
    
    const unsubscribe = onValue(postsQuery, async (snapshot) => {
      if (snapshot.exists()) {
        let posts = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        })) as CommunityPost[];

        // Apply filters
        if (filters) {
          posts = await this.applyPostFilters(posts, filters);
        }

        // Sort by most recent
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        callback(posts);
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromPosts(subscriptionKey);
  }

  private unsubscribeFromPosts(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Real-time comments for a post
  subscribeToComments(
    postId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
    const subscriptionKey = `comments_${postId}`;
    
    this.unsubscribeFromComments(subscriptionKey);
    
    const commentsRef = ref(database, `postComments/${postId}`);
    const commentsQuery = query(commentsRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(commentsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const comments = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        })) as Comment[];
        
        callback(comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromComments(subscriptionKey);
  }

  private unsubscribeFromComments(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Real-time likes for a post
  subscribeToLikes(
    postId: string,
    callback: (likes: Like[], count: number) => void
  ): () => void {
    const subscriptionKey = `likes_${postId}`;
    
    this.unsubscribeFromLikes(subscriptionKey);
    
    const likesRef = ref(database, `postLikes/${postId}`);
    
    const unsubscribe = onValue(likesRef, (snapshot) => {
      if (snapshot.exists()) {
        const likes = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
        })) as Like[];
        
        callback(likes, likes.length);
      } else {
        callback([], 0);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromLikes(subscriptionKey);
  }

  private unsubscribeFromLikes(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Real-time notifications
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const subscriptionKey = `notifications_${userId}`;
    
    this.unsubscribeFromNotifications(subscriptionKey);
    
    const notificationsRef = ref(database, `userNotifications/${userId}`);
    const notificationsQuery = query(notificationsRef, orderByChild('createdAt'), limitToLast(50));
    
    const unsubscribe = onValue(notificationsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
        })) as Notification[];
        
        // Sort by most recent
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        callback(notifications);

        // Trigger notification callbacks for new unread notifications
        notifications
          .filter(n => !n.read)
          .forEach(notification => {
            this.notificationCallbacks.forEach(cb => cb(notification));
          });
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromNotifications(subscriptionKey);
  }

  private unsubscribeFromNotifications(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Subscribe to real-time notification alerts
  onNotification(callback: (notification: Notification) => void): () => void {
    this.notificationCallbacks.add(callback);
    
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  // Real-time user activity status
  subscribeToUserActivity(
    userIds: string[],
    callback: (activities: { [userId: string]: { online: boolean; lastSeen: Date } }) => void
  ): () => void {
    const subscriptionKey = `user_activity_${userIds.join('_')}`;
    
    this.unsubscribeFromUserActivity(subscriptionKey);
    
    const activities: { [userId: string]: { online: boolean; lastSeen: Date } } = {};
    const unsubscribes: (() => void)[] = [];

    userIds.forEach(userId => {
      const activityRef = ref(database, `userActivity/${userId}`);
      const unsub = onValue(activityRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          activities[userId] = {
            online: data.online || false,
            lastSeen: data.lastSeen ? new Date(data.lastSeen) : new Date(),
          };
        } else {
          activities[userId] = {
            online: false,
            lastSeen: new Date(),
          };
        }
        callback({ ...activities });
      });
      unsubscribes.push(unsub);
    });

    this.subscriptions.set(subscriptionKey, {
      unsubscribe: () => unsubscribes.forEach(unsub => unsub())
    });
    
    return () => this.unsubscribeFromUserActivity(subscriptionKey);
  }

  private unsubscribeFromUserActivity(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Community Actions
  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const likeRef = ref(database, `postLikes/${postId}/${userId}`);
      await update(likeRef, {
        userId,
        postId,
        createdAt: serverTimestamp(),
      });

      // Update post like count
      const postRef = ref(database, `communityPosts/${postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists()) {
        const post = postSnapshot.val();
        await update(postRef, {
          likeCount: (post.likeCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });

        // Create notification for post author (if not self-like)
        if (post.authorId !== userId) {
          await this.createNotification(post.authorId, {
            type: 'like',
            fromUserId: userId,
            postId,
            message: 'liked your post',
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const likeRef = ref(database, `postLikes/${postId}/${userId}`);
      await remove(likeRef);

      // Update post like count
      const postRef = ref(database, `communityPosts/${postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists()) {
        const post = postSnapshot.val();
        await update(postRef, {
          likeCount: Math.max(0, (post.likeCount || 0) - 1),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  async addComment(postId: string, userId: string, content: string, parentCommentId?: string): Promise<string> {
    try {
      const commentRef = ref(database, `postComments/${postId}`);
      const commentId = push(commentRef).key!;
      
      const comment = {
        id: commentId,
        postId,
        authorId: userId,
        content,
        parentCommentId: parentCommentId || null,
        likeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await update(ref(database, `postComments/${postId}/${commentId}`), comment);

      // Update post comment count
      const postRef = ref(database, `communityPosts/${postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists()) {
        const post = postSnapshot.val();
        await update(postRef, {
          commentCount: (post.commentCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });

        // Create notification for post author (if not self-comment)
        if (post.authorId !== userId) {
          await this.createNotification(post.authorId, {
            type: 'comment',
            fromUserId: userId,
            postId,
            commentId,
            message: 'commented on your post',
          });
        }
      }

      return commentId;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Add to follower's following list
      const followingRef = ref(database, `userFollowing/${followerId}/${followingId}`);
      await update(followingRef, {
        createdAt: serverTimestamp(),
      });

      // Add to followed user's followers list
      const followerRef = ref(database, `userFollowers/${followingId}/${followerId}`);
      await update(followerRef, {
        createdAt: serverTimestamp(),
      });

      // Create notification
      await this.createNotification(followingId, {
        type: 'follow',
        fromUserId: followerId,
        message: 'started following you',
      });
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Remove from follower's following list
      const followingRef = ref(database, `userFollowing/${followerId}/${followingId}`);
      await remove(followingRef);

      // Remove from followed user's followers list
      const followerRef = ref(database, `userFollowers/${followingId}/${followerId}`);
      await remove(followerRef);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(database, `userNotifications/${userId}/${notificationId}`);
      await update(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = ref(database, `userNotifications/${userId}`);
      const snapshot = await get(notificationsRef);
      
      if (snapshot.exists()) {
        const updates: { [key: string]: any } = {};
        Object.keys(snapshot.val()).forEach(notificationId => {
          updates[`${notificationId}/read`] = true;
          updates[`${notificationId}/readAt`] = serverTimestamp();
        });
        
        await update(notificationsRef, updates);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Update user online status
  async updateUserActivity(userId: string, online: boolean): Promise<void> {
    try {
      const activityRef = ref(database, `userActivity/${userId}`);
      await update(activityRef, {
        online,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user activity:', error);
      throw error;
    }
  }

  // Helper methods
  private async applyPostFilters(posts: CommunityPost[], filters: any): Promise<CommunityPost[]> {
    let filtered = posts;

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.userId) {
      filtered = filtered.filter(p => p.authorId === filters.userId);
    }

    if (filters.following) {
      // This would require getting the user's following list
      // Implementation depends on the current user context
    }

    return filtered;
  }

  // Create notification method
  async createNotification(userId: string, notificationData: Omit<Notification, 'id' | 'createdAt' | 'userId'>): Promise<void> {
    try {
      const notification = {
        ...notificationData,
        userId,
        createdAt: new Date().toISOString(),
        read: false,
      };

      const notificationsRef = ref(database, `notifications/${userId}`);
      await push(notificationsRef, notification);

      // Trigger notification callbacks
      this.notificationCallbacks.forEach(callback => {
        callback({
          id: '', // Will be set by Firebase
          ...notification,
          createdAt: new Date(notification.createdAt),
        } as Notification);
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Cleanup method
  cleanup(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.notificationCallbacks.clear();
  }
}

export const communityRealtimeService = new CommunityRealtimeService();
