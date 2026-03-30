package com.example.voicechanger

import android.content.Context
import android.graphics.PixelFormat
import android.view.*
import android.widget.*

class FloatingPanelManager(private val context: Context, private val audioEngine: AudioEngine) {

    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var panelView: View? = null
    private var params: WindowManager.LayoutParams? = null

    private var isExpanded = false
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f

    fun showPanel() {
        val inflater = context.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        panelView = inflater.inflate(R.layout.floating_panel, null)

        val layoutType = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )

        params?.gravity = Gravity.TOP or Gravity.END
        params?.x = 0
        params?.y = 100

        setupTouchListener()
        setupControls()

        windowManager.addView(panelView, params)
    }

    private fun setupTouchListener() {
        val handle = panelView?.findViewById<View>(R.id.panelHandle)
        handle?.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params?.x = initialX + (initialTouchX - event.rawX).toInt()
                    params?.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(panelView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (Math.abs(event.rawX - initialTouchX) < 10 && Math.abs(event.rawY - initialTouchY) < 10) {
                        toggleExpand()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun toggleExpand() {
        isExpanded = !isExpanded
        val content = panelView?.findViewById<View>(R.id.panelContent)
        content?.visibility = if (isExpanded) View.VISIBLE else View.GONE
    }

    private fun setupControls() {
        val ageSlider = panelView?.findViewById<SeekBar>(R.id.ageSlider)
        val genderToggle = panelView?.findViewById<Switch>(R.id.genderToggle)
        val btnOnOff = panelView?.findViewById<ToggleButton>(R.id.btnOnOff)
        val presetGroup = panelView?.findViewById<RadioGroup>(R.id.presetGroup)

        btnOnOff?.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                audioEngine.start()
            } else {
                audioEngine.stop()
            }
        }

        ageSlider?.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                val age = progress + 5
                val gender = if (genderToggle?.isChecked == true) "Female" else "Male"
                audioEngine.updateParameters(age, gender)
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        genderToggle?.setOnCheckedChangeListener { _, isChecked ->
            val age = (ageSlider?.progress ?: 0) + 5
            val gender = if (isChecked) "Female" else "Male"
            audioEngine.updateParameters(age, gender)
        }

        presetGroup?.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.presetCuteGirl -> audioEngine.pitchFactor = 1.6f
                R.id.presetFemale -> audioEngine.pitchFactor = 1.4f
                R.id.presetMale -> audioEngine.pitchFactor = 0.85f
                R.id.presetDeepVoice -> audioEngine.pitchFactor = 0.7f
                R.id.presetChild -> audioEngine.pitchFactor = 1.8f
                R.id.presetOldMan -> audioEngine.pitchFactor = 0.65f
                R.id.presetRobot -> audioEngine.pitchFactor = 1.0f
                R.id.presetHinata -> audioEngine.pitchFactor = 1.55f
                R.id.presetGojo -> audioEngine.pitchFactor = 0.75f
            }
        }
    }

    fun hidePanel() {
        panelView?.let { windowManager.removeView(it) }
    }
}
