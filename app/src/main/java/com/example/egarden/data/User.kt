package com.example.egarden.data

import kotlin.random.Random

class User {
    var uid: String? = null
    var name: String = ""
    var password: String = ""
    var email: String = ""
    //var workcoins: Int? = null

    constructor() {
        // Default constructor required by Firebase
    }

    constructor(
        uid: String?,
        name: String,
        password: String,
        email: String
        //workcoins: Int?
    ) {
        this.uid = uid
        this.name = name
        this.password = password
        this.email = email
        //this.workcoins = workcoins
    }
}