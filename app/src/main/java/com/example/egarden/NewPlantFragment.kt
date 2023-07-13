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
import androidx.navigation.Navigation
import com.example.egarden.Models.Global
import com.example.egarden.Models.Image
import com.example.egarden.data.DataManager
import com.example.egarden.data.Plant
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
            // Perform input validation
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

        if(name.equals("")){
            Toast.makeText(activity, "All Fields Are Required!", Toast.LENGTH_SHORT).show()
            return
            }
        if(species.equals("")){
            Toast.makeText(activity, "All Fields Are Required!", Toast.LENGTH_SHORT).show()
            return
        }
        if(image.equals("")){
            Toast.makeText(activity, "All Fields Are Required!", Toast.LENGTH_SHORT).show()
            return
        }

        try{
            val UID = Global.currentUser?.uid
            val plant = Plant(UID!!, name, species, image)
            //adding a plant to the garden (store the plant to the database)
            Global.plants.add(plant)
            //Add plant to DB and update local storage
            DataManager.addPlant(plant) { isSuccess -> //Use callback to wait for results
                if (isSuccess)
                {
                    //Update local categories list
                    DataManager.getPlants(Global.currentUser!!.uid.toString()) { plants ->
                        Global.plants = plants
                    }
                    Toast.makeText(activity, "Plant Added successfully!", Toast.LENGTH_SHORT).show()

                    //rewarding the user with 5 work coins for creating a new plant
                    /*val topup = Global.currentUser!!.workcoins!! + 5
                    DataManager.setWorkcoins(topup) { isSuccess ->
                        if (isSuccess){
                            Toast.makeText(activity, "You've been rewarded with 5 Work Coins!", Toast.LENGTH_SHORT).show()
                        }
                    }*/
                } else {
                    Toast.makeText(activity, "Couldn't add plant, please try again!", Toast.LENGTH_LONG).show()
                }

            }
        }catch(ex:Exception){
            Toast.makeText(activity, ex.message, Toast.LENGTH_SHORT).show()
        }
        clearTextBox()
    }

    private fun clearTextBox(){
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
