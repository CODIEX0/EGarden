package com.example.egarden

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import androidx.core.content.FileProvider
import com.example.egarden.Models.Plant
import com.google.android.material.floatingactionbutton.FloatingActionButton
import java.io.File
import java.io.IOException
import kotlin.random.Random

class NewPlantFragment : Fragment() {

    private val ARG_PARAM1 = "param1"
    private val ARG_PARAM2 = "param2"

    private lateinit var p_name: EditText
    private lateinit var p_species: EditText
    private lateinit var imgPlantImage: ImageView
    private lateinit var btnAddPlant: Button
    private lateinit var cameraButton: FloatingActionButton
    private val plantDatabase = PlantDatabase()

    private var plantImages: MutableList<Int> = mutableListOf()

    private val REQUEST_TAKE_PHOTO = 1

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_new_plant, container, false)
        initializeViews(view)

        btnAddPlant.setOnClickListener {
            val name = p_name.text.toString().uppercase()
            val species = p_species.text.toString().uppercase()
            val plantImage = capturePlantImage()

            val plant = Plant(plantImage, name, species)
            //adding a plant to the garden
            plantDatabase.addPlant(plant)
            Toast.makeText(activity, "Sign up successful!", Toast.LENGTH_SHORT).show()
            plantImages.add(plantImage)

            // Perform other operations with the captured data (e.g., store in a database)

            // Clear the input fields and image view
            p_name.setText("")
            p_species.setText("")
            imgPlantImage.setImageResource(0)
        }

        cameraButton.setOnClickListener {
            takePicture()
        }

        return view
    }

    private fun takePicture() {
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (takePictureIntent.resolveActivity(requireActivity().packageManager) != null) {
            try {
                val photoFile = createImageFile()
                val photoUri = FileProvider.getUriForFile(
                    requireContext(),
                    "com.example.android.fileprovider",
                    photoFile
                )
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
                startActivityForResult(takePictureIntent, REQUEST_TAKE_PHOTO)
            } catch (e: IOException) {
                e.printStackTrace()
            }
        }
    }

    // ...

    private fun capturePlantImage(): Int {
        val bitmap = (imgPlantImage.drawable as? BitmapDrawable)?.bitmap
        return if (bitmap != null) {
            // Generate a unique identifier for the image (e.g., using Random or current timestamp)
            val imageId = Random.nextInt()
            // Store the image in a file or database using the generated imageId
            // ...

            // Return the imageId to be added to the list
            imageId
        } else {
            // Return a default placeholder value if no image is captured
            R.drawable.plant
        }
    }

// ...


    private fun createImageFile(): File {
        val storageDir = requireContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        val fileName = "Plant_${Random.nextInt(100)}"
        return File.createTempFile(
            fileName,
            ".jpg",
            storageDir
        )
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_TAKE_PHOTO && resultCode == Activity.RESULT_OK) {
            val bitmap = data?.extras?.get("data") as? Bitmap
            if (bitmap != null) {
                imgPlantImage.setImageBitmap(bitmap)
            }
        }
    }

    private fun initializeViews(view: View) {
        p_name = view.findViewById(R.id.etPlantName)
        p_species = view.findViewById(R.id.etPlantSpecies)
        imgPlantImage = view.findViewById(R.id.imgPlantImage)
        btnAddPlant = view.findViewById(R.id.btnAddPlant)
        cameraButton = view.findViewById(R.id.fabtnCamera)
    }
}
