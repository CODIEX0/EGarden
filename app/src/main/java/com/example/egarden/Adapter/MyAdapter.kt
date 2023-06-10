package com.example.egarden.Adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Models.Image
import com.example.egarden.Models.Plant
import com.example.egarden.R

class MyAdapter(private val plantList: List<Plant>) : RecyclerView.Adapter<MyAdapter.PlantViewHolder>() {

    inner class PlantViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {

        val plant_name: TextView = itemView.findViewById(R.id.tvPlantName)
        val plant_species: TextView = itemView.findViewById(R.id.tvPlantSpecies)
        val plant_image: ImageView = itemView.findViewById(R.id.imgPlantImage)

        fun bind(plant: Plant) {
            plant_name.text = plant.name
            plant_species.text = plant.species
            if (plant.imageData.equals("")) {
                plant_image.visibility = View.INVISIBLE
            } else {
                plant_image.visibility = View.VISIBLE
                Image.setBase64Image(plant.imageData,plant_image)
            }
        }

        init {
            // Set click listener for the itemView
            itemView.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    val plant = plantList[position]
                    // Call the onItemClick method of the listener with the clicked entry
                    onItemClickListener?.onItemClick(plant)
                }
            }
        }
    }
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlantViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_plant, parent, false)
        return PlantViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlantViewHolder, position: Int) {
        val plant = plantList[position]
        holder.bind(plant)
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

    interface OnItemClickListener {
        fun onItemClick(plant: Plant)
    }
    private var onItemClickListener: OnItemClickListener? = null

    // Setter for the click listener
    fun setOnItemClickListener(listener: OnItemClickListener) {
        this.onItemClickListener = listener
    }
}

