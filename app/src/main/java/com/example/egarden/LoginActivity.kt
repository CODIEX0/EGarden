package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.example.egarden.Models.Global
import com.example.egarden.Models.Plant

class LoginActivity : AppCompatActivity() {

    private lateinit var etUserName: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnSignUp: Button
    private lateinit var btnSignIn: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        initView()

        btnSignUp.setOnClickListener {
            val SignupIntent = Intent(this,RegisterActivity::class.java)
            startActivity(SignupIntent)
        }

        // Set onClickListener for button
        btnSignIn.setOnClickListener {
                // Perform login validation
                val isValid = validateLogin()

                if (isValid) {
                    // Navigate to MainActivity
                    Toast.makeText(this,"Signed In Successfully!", Toast.LENGTH_SHORT).show()
                    val intent = Intent(this, MenuActivity::class.java)
                    startActivity(intent)
                } else {
                    // Display an error message or handle the invalid login case
                    Toast.makeText(this, "Sign In Failed, please try again!", Toast.LENGTH_SHORT).show()
                }
        }

        val imgIcon : ImageView = findViewById(R.id.imgIcon)
        val drawable = ContextCompat.getDrawable(this, R.drawable.logo)
        imgIcon.setImageDrawable(drawable)
    }

    private fun validateLogin(): Boolean {

        val username = etUserName.text.toString()
        val password = etPassword.text.toString()

        // Perform input validation
        if (username.equals("") || password.equals("")){
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return false
        }

        val user = Global.users.find { it.name == username && it.password == password }
        return if (user != null) {
            //Success
            Global.currentUser = user
            filterLists()
            true
        } else {
            //Failure
            Toast.makeText(this, "Invalid username or password", Toast.LENGTH_SHORT).show()
            false
        }
    }

    private fun filterLists() {
        //Filter global lists according to logged in user, other user's data is not needed
        //Other user's data gets repopulated each time app opens/LoginActivity
        val plant = Global.plants
        val filteredEntries: MutableList<Plant> = mutableListOf()
        plant.forEach { plant ->
            if (plant.username.equals(Global.currentUser!!.name, ignoreCase = true))
                filteredEntries.add(plant) }
        Global.plants = filteredEntries
    }

    private fun initView() {
        etUserName = findViewById(R.id.etname)
        etPassword = findViewById(R.id.etPassWord)
        btnSignUp = findViewById(R.id.btnSignUp)
        btnSignIn = findViewById(R.id.btnSignIn)
    }
}