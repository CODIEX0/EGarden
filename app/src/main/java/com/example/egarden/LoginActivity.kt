package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.example.egarden.Models.Global
import com.example.egarden.data.Plant
import com.example.egarden.data.User
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.Query
import com.google.firebase.database.ValueEventListener

class LoginActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnSignUp: Button
    private lateinit var btnSignIn: Button
    private lateinit var auth: FirebaseAuth
    private var userDatabaseReference: DatabaseReference? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance()
        userDatabaseReference = FirebaseDatabase.getInstance().getReference("User")
        initView()

        btnSignUp.setOnClickListener {
            val SignupIntent = Intent(this,RegisterActivity::class.java)
            startActivity(SignupIntent)
        }

        // Set onClickListener for button
        btnSignIn.setOnClickListener {

            val name = etEmail.text.toString()
            val password = etPassword.text.toString()

            // Perform login validation
            validateLogin(name, password)
        }

        val imgIcon : ImageView = findViewById(R.id.imgIcon)
        val drawable = ContextCompat.getDrawable(this, R.drawable.logo)
        imgIcon.setImageDrawable(drawable)
    }

    private fun validateLogin(email: String, password: String) {

        // Perform input validation
        if (email.isBlank() || password.isBlank()) {
            // Handle empty email or password
            Log.d("LoginActivity", "Empty name or password")
            return
        }

        // Get an instance of FirebaseAuth
        val auth = FirebaseAuth.getInstance()

        auth.signInWithEmailAndPassword(email, password)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    // Login successful
                    Log.d("LoginActivity", "Login successful")

                    val firebaseUser = auth.currentUser
                    val uid = firebaseUser?.uid

                    if (uid != null) {
                        this@LoginActivity.userDatabaseReference?.child(uid)?.addListenerForSingleValueEvent(object : ValueEventListener {
                            override fun onDataChange(dataSnapshot: DataSnapshot) {
                                val userSnapshot = dataSnapshot.getValue(User::class.java)
                                if (userSnapshot != null) {
                                    Global.currentUser = userSnapshot

                                    val name = userSnapshot.name
                                    Toast.makeText(this@LoginActivity, "Signed In as ${name}", Toast.LENGTH_SHORT).show()
                                    //Navigate
                                    val intent = Intent(this@LoginActivity, MenuActivity::class.java)
                                    startActivity(intent)
                                } else {
                                    // User data not found in the database
                                    Log.d("LoginActivity", "User data not found in the database")
                                    Toast.makeText(this@LoginActivity, "User data not found in the database", Toast.LENGTH_SHORT).show()
                                }
                            }

                            override fun onCancelled(databaseError: DatabaseError) {
                                // Error occurred while accessing user data in the database
                                Log.d("LoginActivity", "Error accessing user data in the database: ${databaseError.message}")
                                Toast.makeText(this@LoginActivity, "Error accessing user data in the database", Toast.LENGTH_SHORT).show()
                            }
                        })
                    }
                } else {
                    // Login failed
                    Log.d("LoginActivity", "Login failed: ${task.exception?.message}")

                    // Show message
                    Toast.makeText(this@LoginActivity, "Authentication failed.", Toast.LENGTH_SHORT).show()
                }
            }

    }

    private fun filterLists() {
        //Filter global lists according to logged in user, other user's data is not needed
        //Other user's data gets repopulated each time app opens/LoginActivity
        val plant = Global.plants
        val filteredPlants: MutableList<Plant> = mutableListOf()
        plant.forEach { plant ->
            if (plant.UID.equals(Global.currentUser!!.uid, ignoreCase = true))
                filteredPlants.add(plant) }
        Global.plants = filteredPlants
    }

    private fun initView() {
        etEmail = findViewById(R.id.edtEmail)
        etPassword = findViewById(R.id.etPassWord)
        btnSignUp = findViewById(R.id.btnSignUp)
        btnSignIn = findViewById(R.id.btnSignIn)
    }
}