package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.MenuItem
import android.widget.Button
import android.widget.Toast
import androidx.annotation.NonNull
import androidx.fragment.app.Fragment
import androidx.navigation.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.egarden.Adapter.MyAdapter
import com.google.android.material.bottomnavigation.BottomNavigationView

class MenuActivity : AppCompatActivity(), OnCardClickListener{

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_menu)

        val signoutButton = findViewById<Button>(R.id.btnSignOut)

        signoutButton.setOnClickListener {
            Toast.makeText(this,"Signed Out Successfully!", Toast.LENGTH_SHORT).show()

            val signoutIntent = Intent(this,LoginActivity::class.java)
            startActivity(signoutIntent)
        }
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setOnNavigationItemSelectedListener(navListener)
        // as soon as the application opens the first fragment should
        // be shown to the user in this case it is the home fragment
        val fragment = HomeFragment()
        replaceFragment(fragment)
    }

    private val navListener = BottomNavigationView.OnNavigationItemSelectedListener { menuItem ->
        // By using switch we can easily get the
        // selected fragment by using the id
        lateinit var selectedFragment: Fragment

        when (menuItem.itemId) {
            R.id.Home -> {
                selectedFragment = HomeFragment()
            }
            R.id.AddPlant -> {
                selectedFragment = NewPlantFragment()
            }
            R.id.ViewPlants -> {
                selectedFragment = ViewPlantsFragment()
            }
            R.id.RemovePlant -> {
                selectedFragment = RemovePlantFragment()
            }
        }
        // replace the current fragment
        // to the selected fragment.
        replaceFragment(selectedFragment)
        true
    }

    fun replaceFragment(fragment : Fragment){

        val fragmentManager = supportFragmentManager
        val fragmentTransaction = fragmentManager.beginTransaction()
        fragmentTransaction.replace(R.id.fragment_container,fragment)
        fragmentTransaction.commit()
    }

    override fun onCardClick(fragment: Fragment) {
         replaceFragment(fragment)
    }
}
interface OnCardClickListener {
    public fun onCardClick(fragment: Fragment)
}