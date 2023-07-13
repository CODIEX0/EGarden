package com.example.egarden

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.PlantAdapter
import com.example.egarden.Models.Global
import com.example.egarden.Models.Global.plants
import com.example.egarden.data.DataManager
import com.example.egarden.data.Plant

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [ViewPlantsFragment.newInstance] factory method to
 * create an instance of this fragment.
 */

class ViewPlantsFragment : Fragment(), PlantAdapter.OnItemClickListener {
    // TODO: Rename and change types of parameters
    private var param1: String? = null
    private var param2: String? = null


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
        return inflater.inflate(R.layout.fragment_view_plants, container, false)
    }

    companion object {
        /**
         * Use this factory method to create a new instance of
         * this fragment using the provided parameters.
         *
         * @param param1 Parameter 1.
         * @param param2 Parameter 2.
         * @return A new instance of fragment ViewPlantsFragment.
         */
        // TODO: Rename and change types and number of parameters
        @JvmStatic
        fun newInstance(param1: String, param2: String) =
            ViewPlantsFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARAM1, param1)
                    putString(ARG_PARAM2, param2)
                }
            }
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val lstPlants = view.findViewById<RecyclerView>(R.id.rvViewGarden)

        // Set up the LinearLayoutManager for the RecyclerView
        val plantLayoutManager = LinearLayoutManager(requireContext())
        lstPlants.layoutManager = plantLayoutManager

        // Retrieve updated plants
        DataManager.getPlants(Global.currentUser!!.uid.toString()) { plants ->
            // Update the global plants list
            Global.plants = plants

            // Create an instance of PlantAdapter and pass the OnItemClickListener
            val plantAdapter = PlantAdapter(Global.plants, this)

            // Set the adapter to the RecyclerView
            lstPlants.adapter = plantAdapter
        }
    }

    override fun onItemClick(plant: Plant) {
        // Handle the click event and navigate to a different fragment
        //Add data to bundle
        val bundle = Bundle()
        bundle.putString("username", plant.UID)
        bundle.putString("name", plant.name)
        bundle.putString("species", plant.species)
        bundle.putString("imageData", plant.imageData)

        val fragment = ViewPlantFragment()
        fragment.arguments = bundle

        //Navigate to fragment, passing bundle
        findNavController().navigate(R.id.action_ViewPlantsFragment_to_ViewPlantFragment, bundle)
    }
}