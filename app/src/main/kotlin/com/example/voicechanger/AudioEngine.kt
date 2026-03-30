package com.example.voicechanger

import android.content.Context
import android.media.*
import android.os.Process
import android.util.Log
import java.util.concurrent.atomic.AtomicBoolean

import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor

class AudioEngine(private val context: Context) {

    private val SAMPLE_RATE = 44100
    private val CHANNEL_CONFIG_IN = AudioFormat.CHANNEL_IN_MONO
    private val CHANNEL_CONFIG_OUT = AudioFormat.CHANNEL_OUT_MONO
    private val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    private val BUFFER_SIZE_IN = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG_IN, AUDIO_FORMAT) * 2
    private val BUFFER_SIZE_OUT = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG_OUT, AUDIO_FORMAT) * 2

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var isRunning = AtomicBoolean(false)
    private var processingThread: Thread? = null

    // Audio Effects
    private var noiseSuppressor: NoiseSuppressor? = null
    private var echoCanceler: AcousticEchoCanceler? = null
    private var gainControl: AutomaticGainControl? = null

    // Voice parameters
    var pitchFactor: Float = 1.0f 
    var formantShift: Float = 1.0f 

    init {
        setupAudio()
    }

    private fun setupAudio() {
        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION, // Optimized for clear voice
                SAMPLE_RATE,
                CHANNEL_CONFIG_IN,
                AUDIO_FORMAT,
                BUFFER_SIZE_IN
            )

            val sessionId = audioRecord?.audioSessionId ?: 0
            if (sessionId != 0) {
                if (NoiseSuppressor.isAvailable()) {
                    noiseSuppressor = NoiseSuppressor.create(sessionId)
                    noiseSuppressor?.enabled = true
                }
                if (AcousticEchoCanceler.isAvailable()) {
                    echoCanceler = AcousticEchoCanceler.create(sessionId)
                    echoCanceler?.enabled = true
                }
                if (AutomaticGainControl.isAvailable()) {
                    gainControl = AutomaticGainControl.create(sessionId)
                    gainControl?.enabled = true
                }
            }

            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .setFlags(AudioAttributes.FLAG_LOW_LATENCY)
                .build()

            val audioFormat = AudioFormat.Builder()
                .setEncoding(AUDIO_FORMAT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(CHANNEL_CONFIG_OUT)
                .build()

            audioTrack = AudioTrack(
                audioAttributes,
                audioFormat,
                BUFFER_SIZE_OUT,
                AudioTrack.MODE_STREAM,
                AudioManager.AUDIO_SESSION_ID_GENERATE
            )

            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            
        } catch (e: Exception) {
            Log.e("AudioEngine", "Setup failed: ${e.message}")
        }
    }

    fun start() {
        if (isRunning.get()) return
        isRunning.set(true)
        
        audioRecord?.startRecording()
        audioTrack?.play()

        processingThread = Thread {
            Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
            val buffer = ShortArray(BUFFER_SIZE_IN / 2)
            
            while (isRunning.get()) {
                val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                if (read > 0) {
                    val processedBuffer = processAudio(buffer, read)
                    audioTrack?.write(processedBuffer, 0, read)
                }
            }
        }.apply { start() }
    }

    fun stop() {
        isRunning.set(false)
        processingThread?.join()
        
        noiseSuppressor?.release()
        echoCanceler?.release()
        gainControl?.release()
        
        audioRecord?.stop()
        audioRecord?.release()
        audioTrack?.stop()
        audioTrack?.release()
        
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.mode = AudioManager.MODE_NORMAL
    }

    /**
     * Simple Time-Domain Pitch Shifting (Linear Interpolation)
     * This is a basic implementation. For professional use, 
     * a library like Oboe or a phase vocoder would be better.
     */
    private fun processAudio(input: ShortArray, size: Int): ShortArray {
        if (pitchFactor == 1.0f) return input

        val output = ShortArray(size)
        var inputIndex = 0.0f
        
        for (i in 0 until size) {
            val index = inputIndex.toInt()
            val nextIndex = (index + 1).coerceAtMost(size - 1)
            val fraction = inputIndex - index
            
            // Linear interpolation
            val sample = (input[index] * (1 - fraction) + input[nextIndex] * fraction).toInt()
            output[i] = sample.toShort()
            
            inputIndex += pitchFactor
            if (inputIndex >= size) {
                inputIndex = 0f // Loop or handle end of buffer
            }
        }
        return output
    }

    fun updateParameters(age: Int, gender: String) {
        // Map age and gender to pitch factor
        // Age 5-80: 5 is child (high pitch), 80 is old (low pitch)
        // Gender: Male (low), Female (high)
        
        var basePitch = 1.0f
        
        // Age mapping (Simplified)
        basePitch = when {
            age < 15 -> 1.5f // Child
            age > 60 -> 0.8f // Old
            else -> 1.0f
        }
        
        // Gender adjustment
        if (gender == "Female") {
            basePitch *= 1.4f
        } else if (gender == "Male") {
            basePitch *= 0.8f
        }
        
        pitchFactor = basePitch
    }
}
