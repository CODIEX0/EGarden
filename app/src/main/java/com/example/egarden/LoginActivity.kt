package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val SigninButton = findViewById<Button>(R.id.btnSignIn)
        val SignupButton = findViewById<Button>(R.id.btnSignup)

        //getting the user name and password
        //performSignIn()

        SignupButton.setOnClickListener {
            val SignupIntent = Intent(this,RegisterActivity::class.java)
            startActivity(SignupIntent)
        }

        SigninButton.setOnClickListener {
            val SigninIntent = Intent(this,MenuActivity::class.java)
            startActivity(SigninIntent)

            Toast.makeText(this,"Signed In Successfully!", Toast.LENGTH_SHORT).show()
        }
    }

    /*private fun performSignIn() {
        val user_name = findViewById<EditText>(R.id.etUserName)
        val password = findViewById<EditText>(R.id.etPassword)

        val input_user_name = user_name.text.toString()
        val input_password = password.text.toString()
    }*/


}