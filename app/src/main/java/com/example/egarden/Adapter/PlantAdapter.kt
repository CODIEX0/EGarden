package com.example.egarden.Adapter

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ImageView
import android.widget.TextView
import com.example.egarden.R

class PlantAdapter(private val context: Activity, private val plant_name: Array<String>, private val plant_species: Array<String>, private val imgid: Array<Int>)
    : ArrayAdapter<String>(context, R.layout.item_plant, plant_name) {

    override fun getView(position: Int, view: View?, parent: ViewGroup): View {
        val inflater = context.layoutInflater
        val rowView = inflater.inflate(R.layout.item_plant, null, true)

        val titleText = rowView.findViewById(R.id.tvPlantName) as TextView
        val imageView = rowView.findViewById(R.id.imgPlantImage) as ImageView
        val subtitleText = rowView.findViewById(R.id.tvPlantSpecies) as TextView

        titleText.text = plant_name[position]
        imageView.setImageResource(imgid[position])
        subtitleText.text = plant_species[position]

        return rowView
    }
}