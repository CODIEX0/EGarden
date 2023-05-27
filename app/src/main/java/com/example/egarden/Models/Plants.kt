package com.example.egarden.Models

data class Plants(var plantPhoto : Array<Int> , var plantName : Array<String> ?= null, var plantSpecies : Array<String> ?= null) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Plants

        if (!plantPhoto.contentEquals(other.plantPhoto)) return false
        if (plantName != null) {
            if (other.plantName == null) return false
            if (!plantName.contentEquals(other.plantName)) return false
        } else if (other.plantName != null) return false
        if (plantSpecies != null) {
            if (other.plantSpecies == null) return false
            if (!plantSpecies.contentEquals(other.plantSpecies)) return false
        } else if (other.plantSpecies != null) return false

        return true
    }

    override fun hashCode(): Int {
        var result = plantPhoto.contentHashCode()
        result = 31 * result + (plantName?.contentHashCode() ?: 0)
        result = 31 * result + (plantSpecies?.contentHashCode() ?: 0)
        return result
    }
}