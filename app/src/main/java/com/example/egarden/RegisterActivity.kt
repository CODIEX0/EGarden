package com.example.egarden

import android.content.ContentValues
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.egarden.Models.Global
import com.example.egarden.data.User
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.ktx.Firebase

class RegisterActivity : AppCompatActivity(){

    private lateinit var etUserName: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var etRePassword: EditText
    private lateinit var btnSignUp: Button
    private lateinit var btnSignIn: Button
    private lateinit var auth: FirebaseAuth
   // private lateinit var binding : ActivityMainBinding\
    private var firebaseReference : FirebaseDatabase? = null
    private var UserDatabaseReference : DatabaseReference? = null
    //private var PlantDatabaseReference : DatabaseReference? = null
    private var Authentication: Boolean = false


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        auth = FirebaseAuth.getInstance()
        val uid = auth.currentUser?.uid
        UserDatabaseReference = FirebaseDatabase.getInstance().getReference("User")
        //PlantDatabaseReference = FirebaseDatabase.getInstance().getReference("Plant")

        // Initialize Firebase Auth
        auth = Firebase.auth
        //insertSampleData()
        // Initialize views
        initView()

        //Sign in user
        btnSignIn.setOnClickListener {
            val SigninIntent = Intent(this,LoginActivity::class.java)
            startActivity(SigninIntent)
        }
        // Sign up user
        btnSignUp.setOnClickListener {
            // Perform input validation
            performSignUp()
        }

        val imgIcon : ImageView = findViewById(R.id.imgIcon)
        val drawable = ContextCompat.getDrawable(this, R.drawable.logo)
        imgIcon.setImageDrawable(drawable)
    }

    public override fun onStart() {
        super.onStart()
        // Check if user is signed in (non-null) and update UI accordingly.
        val currentUser = auth.currentUser
        if (currentUser != null) {
            //reload()
        }
    }

    private fun clearTextBox(){
        //clear edit text boxes
        etUserName.setText("")
        etEmail.setText("")
        etPassword.setText("")
        etRePassword.setText("")
    }

    private fun performSignUp() {

        val username = etUserName.text.toString()
        val email = etEmail.text.toString()
        val password = etPassword.text.toString()
        val confirmPassword = etRePassword.text.toString()
        val freeCoins = 10

        // Perform input validation
        if (username.equals("") || password.equals("") || confirmPassword.equals("") || email.equals("")) {
            //clear text
            clearTextBox()
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        if (password != confirmPassword) {
            //clear passwords
            etPassword.setText("")
            etRePassword.setText("")
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }

        // Check if the username is already taken
        val isUsernameTaken = Global.users.any { it.name == username }
        if (isUsernameTaken) {
            etUserName.setText("")
            Toast.makeText(this, "Username Taken!", Toast.LENGTH_SHORT).show()
            return
        }

        // Check if the email is already taken
        val isEmailTaken = Global.users.any { it.email == email }
        if (isEmailTaken) {
            etEmail.setText("")
            Toast.makeText(this, "Email Taken!", Toast.LENGTH_SHORT).show()
            return
        }

        // Create a new User object
        val newUser = User(null, username, password, email)
        // Add the user to the Global.users list
        if (newUser != null) {
            auth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener { task: Task<AuthResult> ->
                    if (task.isSuccessful) {
                        val firebaseUser = auth.currentUser
                        val uid = firebaseUser?.uid
                        newUser.uid = uid

                        UserDatabaseReference?.child(uid ?: "")?.setValue(newUser)

                        //navigate the user to the login screen
                        Toast.makeText(this, "User Registered!", Toast.LENGTH_SHORT).show()
                        val intent = Intent(this, LoginActivity::class.java)
                        startActivity(intent)

                    } else {
                        Log.w(ContentValues.TAG, "createUserWithEmail:failure", task.exception)

                        Toast.makeText(this, task.exception?.message, Toast.LENGTH_SHORT).show()
                    }
                }
        }
    }

    /*private fun insertSampleData() {
        val testUser = User("coby", "coby@gmail.com", "123456")
        Global.users.add(testUser)

        val pictures = arrayOf(R.drawable.climbing_bamboo,R.drawable.cacti,R.drawable.cannabis,
            R.drawable.banana, R.drawable.bonsai, R.drawable.lemon, R.drawable.mango,
            R.drawable.peach,R.drawable.peanut)

        val plant_names = arrayOf("Climbing Bamboo","Cacti","Cannabis", "Banana", "Bonsai", "Lemon",
            "Mango", "Peach", "Peanut")

        val plant_species = arrayOf("Ampelocalamus scandens","Cactaceae","Cannabaceae","herbaceous",
            "Juniperus spp.","Citrus limon","Mangifera indica","Prunus persica","Arachis hypogaea")

        var Plant : Plant?
        for (i in pictures.indices){
            val img : ImageView = findViewById(R.id.img)
            val drawable = resources.getDrawable(pictures[i])
            img.setImageDrawable(drawable)
            Plant = Plant("coby", plant_names[i].uppercase(), plant_species[i].uppercase(), Image.convertImageToBase64(img))
            PlantDatabaseReference!!.child(plant_names[i]).setValue(Plant)
            Global.plants.add(Plant)
        }
    }*/

    private fun initView() {
        etUserName = findViewById(R.id.etUserName)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        etRePassword = findViewById(R.id.et_re_enter_Password)
        btnSignUp = findViewById(R.id.btnSignUp)
        btnSignIn = findViewById(R.id.btnSignIn)
    }
}
