package com.example.egarden.data

import android.util.Log
import com.example.egarden.Models.Global
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener

object DataManager {
    //Variables
    // Collection names in the Firebase database
    private const val PLANTS_COLLECTION = "plant"
    private const val USERS_COLLECTION = "User"

    fun getPlants(uid: String, callback: (MutableList<Plant>) -> Unit) {
        val plants = mutableListOf<Plant>()

        val database = FirebaseDatabase.getInstance()
        val plantRef = database.getReference(PLANTS_COLLECTION)

        // Query the plants based on the specified UID
        plantRef.orderByChild("uid").equalTo(uid)
            .addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(dataSnapshot: DataSnapshot) {
                    // Iterate over the retrieved data snapshots
                    for (snapshot in dataSnapshot.children) {
                        // Retrieve the category object from the snapshot
                        val plant = snapshot.getValue(Plant::class.java)
                        plant?.let {
                            // Add the plant to the list
                            plants.add(it)
                        }
                    }
                    // Invoke the callback function with the retrieved plants
                    callback(plants)
                }

                override fun onCancelled(databaseError: DatabaseError) {
                    // Handle the error
                    callback(mutableListOf()) // Pass an empty list in case of error
                }
            })
    }

    fun addPlant(plant: Plant, callback: (Boolean) -> Unit) {
        val database = FirebaseDatabase.getInstance()
        val plantRef = database.getReference(PLANTS_COLLECTION)

        // Generate a random ID for the plant entry
        val plantId = plantRef.push().key

        // Add the plant to the Firebase database using the generated ID
        if (plantId != null) {
            plantRef.child(plantId).setValue(plant)
                .addOnSuccessListener {
                    // plant added successfully
                    callback(true) // Invoke the success callback
                }
                .addOnFailureListener { exception ->
                    // Error occurred while adding the plant
                    //Do something with exception...
                    callback(false) // Invoke the failure callback
                }
        } else {
            callback(false) // Invoke the failure callback if plantId is null
        }
    }



    fun setWorkcoins(workcoins: Int, callback: (Boolean) -> Unit) {
        val database = FirebaseDatabase.getInstance()
        val userRef = database.getReference(USERS_COLLECTION)

        val id = Global.currentUser!!.uid

        // Add the work coin to the Firebase database using the generated ID
        if (id != null) {
            val workcoinsRef = userRef.child(id).child("workcoins")
            workcoinsRef.setValue(workcoins)
                .addOnSuccessListener {
                    // work coin added successfully
                    callback(true) // Invoke the success callback
                }
                .addOnFailureListener { exception ->
                    // Error occurred while adding the work coin
                    //Do something with exception...
                    callback(false) // Invoke the failure callback
                }
        } else {
            callback(false) // Invoke the failure callback if workcoinId null
        }
    }

    fun getWorkcoins(uid: String, callback: (Int) -> Unit) {

        val database = FirebaseDatabase.getInstance()
        val userRef = database.getReference(USERS_COLLECTION)

        val workcoinsRef = userRef.child(uid).child("workcoins")

        // Query the workcoins based on the specified UID
        workcoinsRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(dataSnapshot: DataSnapshot) {

                val workcoins: Int = dataSnapshot.value.toString().toInt()

                if(workcoins!=null){
                    callback(workcoins)
                }
            }

            override fun onCancelled(databaseError: DatabaseError) {
                // Handle the error
                callback(10) // Invoke the failure callback
                // Failed to read the value
                Log.d("Failed to read the value","Error: ${databaseError.message}")
            }
        })
    }

}
