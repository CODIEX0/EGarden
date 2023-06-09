package com.example.egarden

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.Toast
import com.example.egarden.Models.Global
import com.example.egarden.Models.Image
import com.example.egarden.Models.Plant
import com.github.dhaval2404.imagepicker.ImagePicker
import com.google.android.material.floatingactionbutton.FloatingActionButton

class NewPlantFragment : Fragment() {

    private lateinit var p_name: EditText
    private lateinit var p_species: EditText
    private lateinit var imgPlantImage: ImageView
    private lateinit var btnAddPlant: Button
    private lateinit var cameraButton: FloatingActionButton

    private lateinit var rootView: View // Added rootView variable for layout inflation

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        rootView = inflater.inflate(R.layout.fragment_new_plant, container, false)
        initializeViews(rootView) // Updated to use rootView instead of view

        btnAddPlant.setOnClickListener {
            addPlant()
        }
        cameraButton.setOnClickListener {
            captureImage()
        }
        return rootView
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        try{
            if (resultCode == Activity.RESULT_OK) {
                //Image Uri will not be null for RESULT_OK
                val img = data?.data!!
                imgPlantImage.setImageURI(img)
            } else if (resultCode == ImagePicker.RESULT_ERROR) {
                Toast.makeText(requireContext(), ImagePicker.getError(data), Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(requireContext(), "Task Cancelled", Toast.LENGTH_SHORT).show()
            }
        }catch(ex:Exception){
            Toast.makeText(activity, ex.message, Toast.LENGTH_SHORT).show()
        }
    }

    private fun addPlant(){
        val name = p_name.text.toString().uppercase()
        val species = p_species.text.toString().uppercase()
        val image = Image.convertImageToBase64(imgPlantImage)

        try{
            if(!name.equals("") || !species.equals("") || !image.equals("")){
                val username = Global.currentUser?.name
                val plant = Plant(username.toString(), name, species, image)
                //adding a plant to the garden (store the plant to the database)
                Global.plants.add(plant)
                Toast.makeText(activity, "Plant Added successfully!", Toast.LENGTH_SHORT).show()
            }else{
                Toast.makeText(activity, "All Fields Are Required!", Toast.LENGTH_SHORT).show()
            }
        }catch(ex:Exception){
            Toast.makeText(activity, ex.message, Toast.LENGTH_SHORT).show()
        }

        // Clear the input fields and image view
        p_name.setText("")
        p_species.setText("")
        imgPlantImage.setImageResource(0)
    }

    private fun captureImage(){
        try{
            ImagePicker.with(this)
                .crop()                     //crop image(optional), check customization for more options
                .compress(1024)             //final image size will be less than 1 MB
                .maxResultSize(1080,1080)   //final image resolution will be less than 1080 x 1080
                .start()
        }catch(ex: Exception){
            Toast.makeText(activity, ex.message, Toast.LENGTH_LONG).show()
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
