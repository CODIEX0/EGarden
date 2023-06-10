package com.example.egarden

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.Global
import com.example.egarden.Models.Plant
import com.example.egarden.Models.PlantViewModel

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [ViewPlantsFragment.newInstance] factory method to
 * create an instance of this fragment.
 */

private lateinit var viewModel : PlantViewModel
lateinit var plantRecyclerView : RecyclerView
lateinit var adapter : MyAdapter

class ViewPlantsFragment : Fragment(), MyAdapter.OnItemClickListener {
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

        plantRecyclerView = view.findViewById(R.id.rvViewGarden)
        plantRecyclerView.layoutManager = LinearLayoutManager(context)
        plantRecyclerView.setHasFixedSize(true)

        adapter = MyAdapter(Global.plants)
        plantRecyclerView.adapter  = adapter

        viewModel = ViewModelProvider(this).get(PlantViewModel::class.java)

        viewModel.allPlants.observe(viewLifecycleOwner, Observer {

            adapter.updatePlantList(it)
        }
        )
    }

    override fun onItemClick(plant: Plant) {
        // Handle the click event and navigate to a different fragment
        //Add data to bundle
        val bundle = Bundle()
        bundle.putString("username", plant.username)
        bundle.putString("name", plant.name)
        bundle.putString("species", plant.species)
        bundle.putString("imageData", plant.imageData)

        val fragment = ViewPlantFragment()
        fragment.arguments = bundle

        //Navigate to fragment, passing bundle
        findNavController().navigate(R.id.action_ViewPlantsFragment_to_ViewPlantFragment, bundle)
    }
}