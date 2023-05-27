package com.example.egarden.Adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Models.Plant
import com.example.egarden.R

class MyAdapter(private val plantList: List<Plant>) : RecyclerView.Adapter<MyAdapter.PlantViewHolder>() {

    inner class PlantViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

        val plant_photo: ImageView = itemView.findViewById(R.id.imgPlantImage)
        val plant_name: TextView = itemView.findViewById(R.id.tvPlantName)
        val plant_species: TextView = itemView.findViewById(R.id.tvPlantSpecies)
    }
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlantViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_plant, parent, false)

        return PlantViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlantViewHolder, position: Int) {

        val currentItem = plantList[position]

        holder.plant_photo.setImageResource(currentItem.plantPhoto)
        holder.plant_name.text = currentItem.plantName
        holder.plant_species.text = currentItem.plantSpecies
    }

    override fun getItemCount(): Int {
        return plantList.size
    }

    fun updatePlantList(plantList: List<Plant>) {
        var list: MutableList<Plant> = plantList.toMutableList()
        list.clear()
        list.addAll(plantList)
        notifyDataSetChanged()
    }


}