package com.example.egarden

import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.RecyclerView
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

lateinit var viewModel : PlantViewModel
private lateinit var plantListView : RecyclerView


