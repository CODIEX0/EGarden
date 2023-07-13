package com.example.egarden.Repository

class PlantRepository {

    @Volatile private var INSTANCE : PlantRepository ?= null

    fun getInstance() : PlantRepository{

        return INSTANCE ?: synchronized(this){
            val instance = PlantRepository()
            INSTANCE =instance
            instance

        }
    }

   /* fun loadPlants(UserList : MutableLiveData<List<Plant>>){
        databaseReference.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try{

                    val _plantList : List<Plant> = snapshot.children.map{ dataSnapshot ->
                        dataSnapshot.getValue(Plant::class.java)!!
                    }

                    UserList.postValue(_plantList)

                }catch (e : java.lang.Exception){

                }
            }

            override fun onCancelled(error: DatabaseError) {
                TODO("Not yet implemented")
            }

        })
    }*/
}