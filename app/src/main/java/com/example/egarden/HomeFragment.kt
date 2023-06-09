package com.example.egarden

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.cardview.widget.CardView
import androidx.fragment.app.FragmentActivity
import com.example.egarden.ui.home.HomeViewModel
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.widget.Toast

// TODO: Rename parameter arguments, choose names that match
// the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
private const val ARG_PARAM1 = "param1"
private const val ARG_PARAM2 = "param2"

/**
 * A simple [Fragment] subclass.
 * Use the [HomeFragment.newInstance] factory method to
 * create an instance of this fragment.
 */

class HomeFragment : Fragment(), OnCardClickListener {
    // TODO: Rename and change types of parameters
    private var param1: String? = null
    private var param2: String? = null

    lateinit var addPlant : CardView
    lateinit var viewGarden : CardView
    lateinit var removePlant : CardView
    var listener: OnCardClickListener? = null

    override fun onAttach(context: Context) {
        super.onAttach(context)
        this.listener = context as OnCardClickListener
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            param1 = it.getString(ARG_PARAM1)
            param2 = it.getString(ARG_PARAM2)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,savedInstanceState: Bundle?): View? {

        val boot = inflater.inflate(R.layout.fragment_home, container, false)

        /*addPlant.setOnClickListener {
            Toast.makeText(requireContext(), "Add Plant Fragment", Toast.LENGTH_SHORT).show()
            replaceFragment(AddPlantFragment())
        }
        viewGarden.setOnClickListener {
            Toast.makeText(requireContext(), "View Garden Fragment", Toast.LENGTH_SHORT).show()
            replaceFragment(ViewPlantsFragment())
        }
        removePlant.setOnClickListener {
            Toast.makeText(requireContext(), "Remove Plant Fragment", Toast.LENGTH_SHORT).show()
            replaceFragment(RemovePlantFragment())
        }*/

        //Inflate the layout for this fragment
        return boot
    }

    fun replaceFragment(fragment : Fragment){

        val fragmentManager = requireActivity().supportFragmentManager
        val fragmentTransaction = fragmentManager.beginTransaction()
        fragmentTransaction.replace(R.id.fragment_container,fragment)
        fragmentTransaction.commit()
    }

    companion object {
        /**
         * Use this factory method to create a new instance of
         * this fragment using the provided parameters.
         *
         * @param param1 Parameter 1.
         * @param param2 Parameter 2.
         * @return A new instance of fragment HomeFragment.
         */
        // TODO: Rename and change types and number of parameters
        @JvmStatic
        fun newInstance(param1: String, param2: String) =
            HomeFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARAM1, param1)
                    putString(ARG_PARAM2, param2)
                }
            }
    }

    override fun onCardClick(fragment: Fragment) {
        replaceFragment(fragment)
    }
}
