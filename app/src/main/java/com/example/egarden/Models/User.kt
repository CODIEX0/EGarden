package com.example.egarden.Models

import kotlin.random.Random

data class User(val id: Int = getAutoId(), val name: String = "", var password: String = ""
) {
    companion object {
        fun getAutoId(): Int {
            val random = Random(1)
            return random.nextInt(100)
        }
    }
}
