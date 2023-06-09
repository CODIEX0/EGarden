package com.example.egarden

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import com.example.egarden.Models.Image

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [RemovePlantFragment.newInstance] factory method to
 * create an instance of this fragment.
 */
class RemovePlantFragment : Fragment() {
    lateinit var txtName : TextView
    lateinit var txtSpecies : TextView
    lateinit var imgEntryImage : ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_remove_plant, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Retrieve the arguments Bundle
        val arguments = arguments

        // Check if arguments exist
        if (arguments != null) {
            // Retrieve the data from the bundle
            val username = arguments.getString("username")
            val plant_name = arguments.getString("category")
            val plant_species = arguments.getString("date")
            val imageData = arguments.getString("imageData")
            //Update UI elements---

            //Get UI elements
            txtName = view.findViewById(R.id.txtPlantName)
            txtSpecies = view.findViewById(R.id.txtPlantSpecies)
            imgEntryImage = view.findViewById(R.id.imgPlantImage)

            //Set Values    `   ```````````         ```````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````
            txtName.text = plant_name
            txtSpecies.text = plant_species
            Image.setBase64Image(imageData, imgEntryImage)

        }
    }
}