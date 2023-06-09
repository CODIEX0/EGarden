package com.example.egarden.Models

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.drawable.BitmapDrawable
import android.net.Uri
import android.provider.MediaStore
import android.util.Base64
import android.widget.ImageView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import java.io.ByteArrayOutputStream

object Image {
    private const val REQUEST_IMAGE_PICKER = 100
    private const val REQUEST_IMAGE_CAPTURE = 200
    private const val PERMISSION_REQUEST_CODE = 101

    fun selectImage(fragment: Fragment, imageView: ImageView) {
        val permission = Manifest.permission.READ_EXTERNAL_STORAGE
        if (ContextCompat.checkSelfPermission(
                fragment.requireContext(),
                permission
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                fragment.requireActivity(),
                arrayOf(permission),
                PERMISSION_REQUEST_CODE
            )
        } else {
            showImagePickerOptions(fragment, imageView)
        }
    }

    private fun showImagePickerOptions(fragment: Fragment, imageView: ImageView) {
        val chooserIntent = Intent(Intent.ACTION_CHOOSER)
        chooserIntent.putExtra(Intent.EXTRA_INTENT, createImagePickerIntent())
        chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Image")
        fragment.startActivityForResult(chooserIntent, REQUEST_IMAGE_PICKER)
    }

    private fun createImagePickerIntent(): Intent {
        val galleryIntent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        return Intent.createChooser(galleryIntent, "Select Image")
            .putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(captureIntent))
    }

    fun handleImagePickerResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
        imageView: ImageView
    ) {
        if (resultCode != Activity.RESULT_OK) return

        when (requestCode) {
            REQUEST_IMAGE_PICKER -> {
                val imageUri: Uri? = data?.data
                imageView.setImageURI(imageUri)
            }
            REQUEST_IMAGE_CAPTURE -> {
                val imageBitmap = data?.extras?.get("data") as? Bitmap
                imageView.setImageBitmap(imageBitmap)
            }
        }
    }

    fun convertImageToBase64(imageView: ImageView): String? {
        val drawable = imageView.drawable
        if (drawable is BitmapDrawable) {
            val bitmap = drawable.bitmap
            if (bitmap != null) {
                val byteArrayOutputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
                val byteArray = byteArrayOutputStream.toByteArray()
                return Base64.encodeToString(byteArray, Base64.DEFAULT)
            }
        }
        return null
    }

    fun setBase64Image(base64String: String?, imageView: ImageView) {
        try {
            if (base64String.isNullOrEmpty()) {
                // Set the image to gray if the base64String is null or empty
                val grayScaleColorMatrix = ColorMatrix().apply {
                    setSaturation(0f)
                }
                val grayScaleFilter = ColorMatrixColorFilter(grayScaleColorMatrix)
                imageView.colorFilter = grayScaleFilter
                imageView.setImageResource(android.R.color.transparent)
            } else {
                val decodedBytes = Base64.decode(base64String, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                imageView.setImageBitmap(bitmap)
                imageView.colorFilter = null // Remove any existing color filter
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // Set the image to gray if an exception occurs during decoding
            val grayScaleColorMatrix = ColorMatrix().apply {
                setSaturation(0f)
            }
            val grayScaleFilter = ColorMatrixColorFilter(grayScaleColorMatrix)
            imageView.colorFilter = grayScaleFilter
            imageView.setImageResource(android.R.color.transparent)
        }
    }
}
