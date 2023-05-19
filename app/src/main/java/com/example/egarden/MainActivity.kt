package com.example.egarden

import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.Toast

class MainActivity : AppCompatActivity() {

    private lateinit var imgPlantImage : ImageView
    private lateinit var btnAddPlant : Button
    private lateinit var btnSignout : Button
    private val REQUEST_IMAGE_CAPTURE = 100

    private val pickImage = 100
    private var imageUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        imgPlantImage = findViewById(R.id.imgPlantImage)
        btnAddPlant = findViewById(R.id.btnAddPlant)
        btnSignout = findViewById<Button>(R.id.btnSignOut)

        btnSignout.setOnClickListener {

            val SignoutIntent = Intent(this,RegisterActivity::class.java)
            startActivity(SignoutIntent)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

        if(requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK){
            val imageBitmap = data?.extras?.get("data") as Bitmap
            imgPlantImage.setImageBitmap(imageBitmap)
        }else{
            super.onActivityResult(requestCode, resultCode, data)
        }

        if (resultCode == RESULT_OK && requestCode == pickImage) {
            imageUri = data?.data
            imgPlantImage.setImageURI(imageUri)
        }

    }

    fun addPicture(view: View) {
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)

        try{
            startActivityForResult(takePictureIntent,REQUEST_IMAGE_CAPTURE)
        }catch(e: ActivityNotFoundException){
            Toast.makeText(this,"Error: " + e.localizedMessage,Toast.LENGTH_SHORT).show()
        }
    }
}