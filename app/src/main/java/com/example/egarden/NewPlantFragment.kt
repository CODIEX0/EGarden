package com.example.egarden

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
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
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.PlantViewModel
import com.github.dhaval2404.imagepicker.ImagePicker
import com.google.android.material.floatingactionbutton.FloatingActionButton
import java.io.File
import java.io.FileReader
import java.io.IOException
import kotlin.random.Random

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER


/**
 * A simple [Fragment] subclass.
 * Use the [NewPlantFragment.newInstance] factory method to
 * create an instance of this fragment.
 */

class NewPlantFragment : Fragment() {

    private val ARG_PARAM1 = "param1"
    private val ARG_PARAM2 = "param2"

    private lateinit var p_name : EditText
    private lateinit var p_species : EditText
    private lateinit var imgPlantImage : ImageView
    private lateinit var btnAddPlant : Button
    private lateinit var camera_button: FloatingActionButton

    private var plantImg : Int = 0
    // TODO: Rename and change types of parameters
    private var param1: String? = null
    private var param2: String? = null

    lateinit var photoPath: String
    val REQUEST_TAKE_PHOTO = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            param1 = it.getString(ARG_PARAM1)
            param2 = it.getString(ARG_PARAM2)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_new_plant, container, false)

        initializeViews(view)

        btnAddPlant.setOnClickListener {
            var picture = pictures.toMutableList()
            var name = plant_names.toMutableList()
            var species = plant_species.toMutableList()
            name.add(p_name.text.toString().uppercase())
            species.add(p_species.text.toString().uppercase())
            picture.add(plantImg)
            pictures = picture.toTypedArray()
        }

        camera_button.setOnClickListener {
            ImagePicker.with(this)
                .crop()                     //crop image(optional), check customization for more options
                .compress(1024)             //final image size will be less than 1 MB
                .maxResultSize(1080,1080)   //final image resolution will be less than 1080 x 1080
                .start()
            //takePicture()
        }
        return view
    }

    companion object {
        /**
         * Use this factory method to create a new instance of
         * this fragment using the provided parameters.
         *
         * @param param1 Parameter 1.
         * @param param2 Parameter 2.
         * @return A new instance of fragment NewPlantFragment.
         */
        // TODO: Rename and change types and number of parameters
        @JvmStatic
        fun newInstance(param1: String, param2: String) =
            NewPlantFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARAM1, param1)
                    putString(ARG_PARAM2, param2)
                }
            }
    }

    /*fun takePicture(){
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)

        if(takePictureIntent.resolveActivity(Activity().packageManager) != null){

            var photoFile: File? = null
            try{
                photoFile = createImageFile()
            }catch(e :IOException){

            }
            if(photoFile != null){

                *//*val photoUri = FileProvider.getUriForFile(
                    this,
                    "com.example.android.fileprovider",
                    photoFile
                )*//*
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT,photoUri)
                startActivityForResult(takePictureIntent,REQUEST_TAKE_PHOTO)
            }

        }

    }*/

    /*private fun createImageFile() : File?{
        var r = Random.Default
        val fileName = "Plant_" + r.nextInt(100)
        //val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        *//*val image = File.createTempFile(
            fileName,
            ".jpg",
            storageDir
        )*//*

        photoPath = image.absolutePath

        return image
    }*/

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

        imgPlantImage.setImageURI(data?.data)
        plantImg = data?.data as Int
    }

    private fun initializeViews(view : View){
        p_name = view.findViewById(R.id.etPlantName)
        p_name = view.findViewById(R.id.etPlantSpecies)
        imgPlantImage = view.findViewById(R.id.imgPlantImage) as ImageView
        btnAddPlant = view.findViewById(R.id.btnAddPlant) as Button
        camera_button = view.findViewById(R.id.fabtnCamera) as FloatingActionButton
    }
}