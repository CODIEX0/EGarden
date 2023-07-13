package com.example.egarden

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth

class MenuActivity : AppCompatActivity(), OnCardClickListener{
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_menu)

        auth = FirebaseAuth.getInstance()

        val signoutButton = findViewById<Button>(R.id.btnSignOut)
        signoutButton.setOnClickListener {
            //signing the current user out of firebase
            auth.signOut()

            Toast.makeText(this,"Signing out...", Toast.LENGTH_SHORT).show()
            //navigating to the login activity
            val signoutIntent = Intent(this,LoginActivity::class.java)
            startActivity(signoutIntent)

        }
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setOnNavigationItemSelectedListener(navListener)
        // as soon as the application opens the first fragment should
        // be shown to the user in this case it is the home fragment
        val fragment = NewPlantFragment()
        replaceFragment(fragment)
    }

    private val navListener = BottomNavigationView.OnNavigationItemSelectedListener { menuItem ->
        // By using switch we can easily get the
        // selected fragment by using the id
        lateinit var selectedFragment: Fragment

        when (menuItem.itemId) {

            R.id.navigation_add_new_plant -> {
                selectedFragment = NewPlantFragment()
            }
            R.id.navigation_home -> {
                selectedFragment = HomeFragment()
            }
            R.id.navigation_view_garden -> {
                selectedFragment = ViewPlantsFragment()
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