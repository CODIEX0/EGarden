package com.example.egarden

import com.example.egarden.data.Plant

class PlantDatabase {
    private val plants: MutableList<Plant> = mutableListOf()

    fun addPlant(plant: Plant) {
        plants.add(plant)
    }

    fun getPlantByName(name: String): Plant? {
        return plants.find { it.name == name}
    }

    fun getAllPlants(): List<Plant> {
        return plants.sortedBy {it.name}.toList()
    }
}