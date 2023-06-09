package com.example.egarden

import android.content.Context
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.navigation.Navigation
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.Global
import com.example.egarden.Models.User
import com.google.android.material.textfield.TextInputLayout
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase

class RegisterActivity : AppCompatActivity(){

    private lateinit var etUserName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var etRePassword: EditText
    private lateinit var btnSignUp: Button
    private lateinit var btnSignIn: Button


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        initView()

        //Sign in user
        btnSignIn.setOnClickListener {
            val SigninIntent = Intent(this,LoginActivity::class.java)
            startActivity(SigninIntent)
        }
        // Sign up user
        btnSignUp.setOnClickListener {
            // Perform input validation
            val isValid = performSignUp()

            if (isValid) {
                Toast.makeText(this,"Successfully signed up!", Toast.LENGTH_SHORT).show()
                val SigninIntent = Intent(this,LoginActivity::class.java)
                startActivity(SigninIntent)
            }else{
                Toast.makeText(this,"Sign up failed, please try again!", Toast.LENGTH_SHORT).show()
            }
        }

        val imgIcon : ImageView = findViewById(R.id.imgIcon)
        val drawable = ContextCompat.getDrawable(this, R.drawable.egarden_logo)
        imgIcon.setImageDrawable(drawable)
    }

    private fun clearTextBox(){
        //clear edit text boxes
        etUserName.setText("")
        etPassword.setText("")
        etRePassword.setText("")
    }

    private fun performSignUp(): Boolean {

        val username = etUserName.text.toString()
        val email = etEmail.text.toString()
        val password = etPassword.text.toString()
        val confirmPassword = etRePassword.text.toString()

        // Perform input validation
        if (username.equals("") || password.equals("") || confirmPassword.equals("") || email.equals("")) {
            clearTextBox()
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return false
        }

        if (password != confirmPassword) {
            clearTextBox()
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return false
        }

        // Check if the username is already taken
        val isUsernameTaken = Global.users.any { it.name == username }
        if (isUsernameTaken) {
            clearTextBox()
            Toast.makeText(this, "Username Taken!", Toast.LENGTH_SHORT).show()
            return false
        }

        // Check if the email is already taken
        val isEmailTaken = Global.users.any { it.email == email }
        if (isEmailTaken) {
            clearTextBox()
            Toast.makeText(this, "Email Taken!", Toast.LENGTH_SHORT).show()
            return false
        }
        // Create a new User object
        val newUser = User(username, email, password)

        // Add the user to the Global.users list
        Global.users.add(newUser)

        return true
    }

    private fun initView() {
        etUserName = findViewById(R.id.etUserName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        etRePassword = findViewById(R.id.et_re_enter_Password)
        btnSignUp = findViewById(R.id.btnSignUp)
        btnSignIn = findViewById(R.id.btnSignIn)
    }
}
