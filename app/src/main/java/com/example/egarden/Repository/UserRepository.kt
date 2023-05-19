package com.example.egarden.Repository

import androidx.lifecycle.MutableLiveData
import com.example.egarden.Models.User

class UserRepository {

    @Volatile private var INSTANCE : UserRepository ?= null

    fun getInstance() : UserRepository{

        return INSTANCE ?: synchronized(this){
            val instance = UserRepository()
            INSTANCE =instance
            instance

        }
    }

    /*fun loadUsers(UserList : MutableLiveData<List<User>>){
        databaseReference.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try{

                    val _userList : List<User> = snapshot.children.map{ dataSnapshot ->
                        dataSnapshot.getValue(User::class.java)!!
                    }

                    UserList.postValue(_userList)

                }catch (e : java.lang.Exception){

                }
            }

            override fun onCancelled(error: DatabaseError) {
                TODO("Not yet implemented")
            }

        })
    }*/
}