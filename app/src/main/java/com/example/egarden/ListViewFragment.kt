package com.example.egarden

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ListView
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.egarden.Adapter.MyAdapter
import com.example.egarden.Models.Plant
import com.example.egarden.Models.PlantViewModel

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [ListViewFragment.newInstance] factory method to
 * create an instance of this fragment.
 */

private lateinit var viewModel : PlantViewModel
private lateinit var plantListView : ListView


class ListViewFragment : Fragment() {
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
        return inflater.inflate(R.layout.fragment_list_view, container, false)
    }

    companion object {
        /**
         * Use this factory method to create a new instance of
         * this fragment using the provided parameters.
         *
         * @param param1 Parameter 1.
         * @param param2 Parameter 2.
         * @return A new instance of fragment ListViewFragment.
         */
        // TODO: Rename and change types and number of parameters
        @JvmStatic
        fun newInstance(param1: String, param2: String) =
            ListViewFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARAM1, param1)
                    putString(ARG_PARAM2, param2)
                }
            }
    }

    /*override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        plantListView = view.findViewById(R.id.lstViewGarden)
        plantListView.layoutManager = LinearLayoutManager(context)
        plantRecyclerView.setHasFixedSize(true)

        val data = ArrayList<Plant>()
        val pictures = listOf(R.drawable.weed, R.drawable.banana, R.drawable.bonsai, R.drawable.lemon, R.drawable.mango,R.drawable.peach, R.drawable.peanut)
        val plant_names = listOf("Cannabis", "Banana", "Bonsai", "Lemon", "Mango", "Peach", "Peanut")
        val plant_species = listOf("Cannabaceae","herbaceous","Juniperus spp.","Citrus limon","Mangifera indica","Prunus persica","Arachis hypogaea")


        for (i in 1..20){
            data.add(Plant(R.drawable.cacti,"Cacti", "Cactaceae"))
        }

        adapter = MyAdapter(data)
        plantRecyclerView.adapter  = adapter

        viewModel = ViewModelProvider(this).get(PlantViewModel::class.java)

        viewModel.allPlants.observe(viewLifecycleOwner, Observer {

            adapter.updatePlantList(it)
        }
        )
    }*/
}