package com.example.egarden.Models

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.egarden.Repository.UserRepository
import com.example.egarden.data.User

class UserViewModel : ViewModel() {

    private val repository : UserRepository
    private val _allUsers = MutableLiveData<List<User>>()
    val allUsers : LiveData<List<User>> = _allUsers

    init {
        repository = UserRepository().getInstance()
        //repository.loadUsers(_allUsers)
    }
}