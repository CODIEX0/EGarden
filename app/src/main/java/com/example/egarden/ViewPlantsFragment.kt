package com.example.egarden

import android.graphics.drawable.Drawable
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.graphics.drawable.toDrawable
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.Global
import com.example.egarden.Models.Plant
import com.example.egarden.Models.PlantViewModel
import java.util.concurrent.CountDownLatch

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
lateinit var pictures : Array<Int>
lateinit var plant_names : Array<String>
lateinit var plant_species : Array<String>
private val plantDatabase = PlantDatabase()

class ViewPlantsFragment : Fragment() {
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

        /*pictures = arrayOf(R.drawable.climbing_bamboo,R.drawable.cacti,R.drawable.cannabis,
            R.drawable.banana, R.drawable.bonsai, R.drawable.lemon, R.drawable.mango,
            R.drawable.peach,R.drawable.peanut)

        plant_names = arrayOf("Climbing Bamboo","Cacti","Cannabis", "Banana", "Bonsai", "Lemon",
            "Mango", "Peach", "Peanut")

        plant_species = arrayOf("Ampelocalamus scandens","Cactaceae","Cannabaceae","herbaceous",
            "Juniperus spp.","Citrus limon","Mangifera indica","Prunus persica","Arachis hypogaea")

        var plant : Plant? = null
        for (i in pictures.indices){
            plant = Plant(pictures[i].toDrawable(), plant_names[i].uppercase(), plant_species[i].uppercase())
            plantDatabase.addPlant(plant)
        }*/

        adapter = MyAdapter(Global.plants)
        plantRecyclerView.adapter  = adapter

        viewModel = ViewModelProvider(this).get(PlantViewModel::class.java)

        viewModel.allPlants.observe(viewLifecycleOwner, Observer {

            adapter.updatePlantList(it)
        }
        )
    }
}