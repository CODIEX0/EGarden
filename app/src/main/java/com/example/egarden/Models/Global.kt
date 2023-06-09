package com.example.egarden.Models


//Singleton class for storing live data
object Global {
    var users: MutableList<User> = mutableListOf()
    var plants: MutableList<Plant> = mutableListOf()

    var currentUser: User? = null
}