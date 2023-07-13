package com.example.egarden.Adapter

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Models.Image
import com.example.egarden.data.Plant
import com.example.egarden.R

class PlantAdapter(
    private val plants: List<Plant>,
    private val onItemClickListener: OnItemClickListener
) :
    RecyclerView.Adapter<PlantAdapter.PlantViewHolder>() {

    inner class PlantViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

        val plant_name: TextView = itemView.findViewById(R.id.tvPlantName)
        val plant_species: TextView = itemView.findViewById(R.id.tvPlantSpecies)
        val plant_image: ImageView = itemView.findViewById(R.id.imgPlantImage)

        init {
            // Set click listener for the itemView
            itemView.setOnClickListener {
                val position = layoutPosition // adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    val plant = plants[position]
                    // Call the onItemClick method of the listener with the clicked plant
                    onItemClickListener?.onItemClick(plant)
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlantViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_plant, parent, false)
        return PlantViewHolder(view)
    }

    override fun getItemCount(): Int {
        return plants.size
    }

    override fun onBindViewHolder(holder: PlantViewHolder, position: Int) {

        val currentPlant = plants[position]

        if (currentPlant.imageData == null || currentPlant.imageData == "null") {
            holder.plant_image.visibility = View.INVISIBLE
        }
        holder.plant_name.text = currentPlant.name

        holder.plant_species.text = currentPlant.species
    }


    interface OnItemClickListener {
        fun onItemClick(plant: Plant)
    }
}