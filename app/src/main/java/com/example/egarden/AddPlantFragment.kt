package com.example.egarden

import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.ViewGroup
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.navigation.Navigation
import com.example.egarden.Models.Global
import com.example.egarden.data.DataManager
import com.example.egarden.data.Plant
import com.github.dhaval2404.imagepicker.ImagePicker
import com.google.android.material.floatingactionbutton.FloatingActionButton
import java.io.ByteArrayOutputStream

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [AddPlantFragment.newInstance] factory method to
 * create an instance of this fragment.
 */
class AddPlantFragment : Fragment() {
    // TODO: Rename and change types of parameters
    private var param1: String? = null
    private var param2: String? = null

    private lateinit var imgPlantImage : ImageView
    private lateinit var btnAddPlant : Button
    private lateinit var camera_button: FloatingActionButton
    private lateinit var txtname: TextView
    private lateinit var txtSpecies: TextView

    val REQUEST_IMAGE_CAPTURE = 100

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            param1 = it.getString(ARG_PARAM1)
            param2 = it.getString(ARG_PARAM2)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,savedInstanceState: Bundle?): View? {

        // Inflate the layout for this fragment
        val view = inflater.inflate(R.layout.fragment_add_plant, container, false)

        initializeViews()
        imgPlantImage.setOnClickListener{
            ImagePicker.with(this)
                .crop()                     //crop image(optional), check customization for more options
                .compress(1024)             //final image size will be less than 1 MB
                .maxResultSize(1080,1080)   //final image resolution will be less than 1080 x 1080
                .start()
        }

        camera_button.setOnClickListener {
            ImagePicker.with(this)
                .crop()                     //crop image(optional), check customization for more options
                .compress(1024)             //final image size will be less than 1 MB
                .maxResultSize(1080,1080)   //final image resolution will be less than 1080 x 1080
                .start()
        }

        btnAddPlant.setOnClickListener {

        }

        return view
    }

    private fun initializeViews(){

        txtname = requireView().findViewById(R.id.txtPlantName) as TextView
        imgPlantImage = requireView().findViewById(R.id.imgPlantImage) as ImageView
        btnAddPlant = requireView().findViewById(R.id.btnAddPlant) as Button
        camera_button = requireView().findViewById(R.id.fabtnCamera) as FloatingActionButton
    }

    companion object {
        /**
         * Use this factory method to create a new instance of
         * this fragment using the provided parameters.
         *
         * @param param1 Parameter 1.
         * @param param2 Parameter 2.
         * @return A new instance of fragment AddPlantFragment.
         */
        //TODO: Rename and change types and number of parameters
        @JvmStatic
        fun newInstance(param1: String, param2: String) =
            AddPlantFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARAM1, param1)
                    putString(ARG_PARAM2, param2)
                }
            }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

        if(requestCode == REQUEST_IMAGE_CAPTURE && resultCode == AppCompatActivity.RESULT_OK){
            val imageBitmap = data?.extras?.get("data") as Bitmap
            imgPlantImage.setImageBitmap(imageBitmap)
        }else{
                super.onActivityResult(requestCode, resultCode, data)
        }

        imgPlantImage.setImageURI(data?.data)
    }

     fun addPlant() {
         //Variables
         var name : String
         var species : String
         var imageData : String

         //Get data from page
         name = txtname.text.toString()
         species = txtSpecies.text.toString()

         imageData = convertImageToBase64(imgPlantImage).toString()

         if (name == "") {
             Toast.makeText(activity, "Enter the plant's name", Toast.LENGTH_SHORT).show()
             return
         }
         if (species == "") {
             Toast.makeText(activity, "Enter the plant's species", Toast.LENGTH_SHORT).show()
             return
         }

         val plant = Plant(
             Global.currentUser?.uid.toString(), //Store UID to create relationship
             name,
             species,
             imageData
         )

         //Add category to DB and update local storage
         DataManager.addPlant(plant) { isSuccess -> //Use callback to wait for results
             if (isSuccess)
             {
                 //Update local categories list
                 DataManager.getPlants(Global.currentUser!!.uid.toString()) { plants ->
                     Global.plants = plants
                 }
                 Toast.makeText(activity, "Plant Created Successfully!", Toast.LENGTH_SHORT).show()

             } else {
                 Toast.makeText(activity, "Plant Creation Failed...", Toast.LENGTH_LONG).show()
             }

         }
    }

    private fun convertImageToBase64(imageView: ImageView): String? {
        val drawable = imageView.drawable
        if (drawable is BitmapDrawable) {
            val bitmap = drawable.bitmap
            if (bitmap != null) {
                val byteArrayOutputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
                val byteArray = byteArrayOutputStream.toByteArray()
                return Base64.encodeToString(byteArray, Base64.DEFAULT)
            }
        }
        return null
    }

    fun replaceFragment(fragment : Fragment){

        val fragmentManager = requireActivity().supportFragmentManager
        val fragmentTransaction = fragmentManager.beginTransaction()
        fragmentTransaction.replace(R.id.fragment_container,fragment)
        fragmentTransaction.commit()
    }
}
