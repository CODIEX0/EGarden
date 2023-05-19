package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.User
import com.google.android.material.textfield.TextInputLayout
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase

class RegisterActivity : AppCompatActivity(), View.OnClickListener {

    private lateinit var etUserName: EditText
    private lateinit var etPassword: EditText
    private lateinit var etRePassword: EditText
    private lateinit var btnSignUp: Button
    private lateinit var btnSignIn: Button

    private var regUserName: TextInputLayout? = null
    private var regPassword: TextInputLayout? = null
    private var regRePassword: TextInputLayout? = null

    lateinit var rootNode: FirebaseDatabase
    lateinit var reference: DatabaseReference

    //private lateinit var sqLiteHelper: SQLiteHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        initView()

        //sqLiteHelper = SQLiteHelper(this)

        btnSignIn.setOnClickListener {
            val SigninIntent = Intent(this,LoginActivity::class.java)
            startActivity(SigninIntent)
        }
        btnSignUp.setOnClickListener { performSignUp()}
    }

    private fun clearTextBox(){
        //clear edit text boxes
        etUserName.setText("")
        etPassword.setText("")
        etRePassword.setText("")
    }

    private fun performSignUp(){
        val user_name = etUserName.text.toString()
        val password = etPassword.text.toString()
        val re_password = etRePassword.text.toString()

        val SignupIntent = Intent(this,MenuActivity::class.java)
        startActivity(SignupIntent)

        /*if(user_name.isEmpty() || password.isEmpty() && !password.equals(re_password)){

            clearTextBox()

            Toast.makeText(this,"Please Enter Correct User Name and Password!",Toast.LENGTH_SHORT).show()
        }else{
            val user = User(name = user_name, password = password)
            //val status = sqLiteHelper.insertUser(user)

            //check insert success or not success
            if (status > -1){
                // Sign in success, go to the home page fragment i.e HomeFragment
                val SignupIntent = Intent(this,MenuActivity::class.java)
                startActivity(SignupIntent)

                Toast.makeText(this,"Successfully signed up!", Toast.LENGTH_SHORT).show()
            }else{
                Toast.makeText(this,"Sign up failed, please try again!", Toast.LENGTH_SHORT).show()
            }
        }*/
    }

    private fun initView() {
        etUserName = findViewById(R.id.etUserName)
        etPassword = findViewById(R.id.etPassword)
        etRePassword = findViewById(R.id.et_re_enter_Password)
        btnSignUp = findViewById(R.id.btnSignup)
        btnSignIn = findViewById(R.id.btnSignIn)
        regUserName = findViewById(R.id.etUserName)
        regPassword = findViewById(R.id.etPassword)
        regPassword = findViewById(R.id.etPassword)
        regRePassword = findViewById(R.id.et_re_enter_Password)
    }

    override fun onClick(p0: View?) {
        TODO("Not yet implemented")
    }
}
