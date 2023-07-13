package com.example.egarden.Models

import com.example.egarden.data.Plant
import com.example.egarden.data.User


//Singleton class for storing live data
object Global {
    var users: MutableList<User> = mutableListOf()
    var plants: MutableList<Plant> = mutableListOf()

    var currentUser: User? = null
}