package com.example.egarden.Models

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.egarden.Repository.PlantRepository
import com.example.egarden.Repository.UserRepository

class PlantViewModel : ViewModel() {
    private val repository : PlantRepository
    private val _allPlants = MutableLiveData<List<Plant>>()
    val allPlants : LiveData<List<Plant>> = _allPlants

    init {
        repository = PlantRepository().getInstance()
       // repository.loadPlants(_allPlants)
    }
}