package com.example.egarden

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.example.egarden.Models.User

class SQLiteHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION){

    companion object {
        private const val DATABASE_VERSION = 1
        private const val DATABASE_NAME = "egarden.db"
        private const val TBL_USER = "tbl_user"
        private const val ID = "id"
        private const val USER_NAME = "name"
        private const val USER_PASSWORD = "password"
        private const val TBL_PLANT = "tbl_plant"
        private const val PLANT_PHOTO_ID = "plant_photo_id"
        private const val PLANT_NAME = "plant_name"
        private const val PLANT_SPECIES = "plant_species"
    }

    override fun onCreate(db: SQLiteDatabase?) {
        val createTblUser = ("CREATE TABLE "
                + TBL_USER      + "("
                + ID            + "INTEGER PRIMARY KEY,"
                + USER_NAME     + " TEXT,"
                + USER_PASSWORD + " TEXT" + ")")

        val createTblPlant = ("CREATE TABLE "
                + TBL_PLANT      + "("
                + ID             + "INTEGER PRIMARY KEY,"
                + PLANT_PHOTO_ID + " TEXT,"
                + PLANT_SPECIES  + " TEXT"
                + PLANT_SPECIES  + " TEXT" + ")")
    }

    override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
        db!!.execSQL("DROP TABLE IF EXISTS $TBL_USER")
        onCreate(db)
    }

    fun insertUser(user: User): Long {
        val db = this.writableDatabase

        val contentValues = ContentValues()
        contentValues.put(ID, user.id)
        contentValues.put(USER_NAME, user.name)
        contentValues.put(USER_PASSWORD, user.password)

        val success = db.insert(TBL_USER, null, contentValues)
        db.close()
        return success
    }

    @SuppressLint("Range")
    fun getAllUsers(): ArrayList<User>{
        val UserList: ArrayList<User> = ArrayList()
        val selectQuery = "SELECT * FROM $TBL_USER"
        val db = this.readableDatabase

        val cursor: Cursor?

        try{
            cursor = db.rawQuery(selectQuery,null)
        }catch (e: Exception){
            e.printStackTrace()
            db.execSQL(selectQuery)
            return ArrayList()
        }

        var id: Int
        var name: String
        var password: String

        if (cursor.moveToFirst()){
            do {
                id = cursor.getInt(cursor.getColumnIndex("id"))
                name = cursor.getString(cursor.getColumnIndex("name"))
                password = cursor.getString(cursor.getColumnIndex("password"))

                val user = User(id = id, name=  name, password = password)
                UserList.add(user)
            } while (cursor.moveToNext())
        }

        return UserList
    }
}