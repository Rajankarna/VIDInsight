import torch
import whisper
import sys

def check_gpu_usage():
    # Check if CUDA is available
    cuda_available = torch.cuda.is_available()
    print(f"CUDA Available: {cuda_available}")

    if cuda_available:
        # Get GPU device name
        gpu_name = torch.cuda.get_device_name(0)
        print(f"GPU Device: {gpu_name}")
        # Get CUDA version
        cuda_version = torch.version.cuda
        print(f"CUDA Version: {cuda_version}")
    else:
        print("No GPU detected, falling back to CPU.")

    # Set device based on CUDA availability
    device = "cuda" if cuda_available else "cpu"
    print(f"Selected Device for Model: {device}")

    try:
        # Load Whisper model on the selected device
        print("Loading Whisper 'base' model...")
        whisper_model = whisper.load_model("base", device=device)
        print(f"Whisper Model Loaded on Device: {whisper_model.device}")
        
        # Verify if the model is on GPU
        if str(whisper_model.device).startswith("cuda"):
            print("Success: Whisper model is using the GPU!")
        else:
            print("Warning: Whisper model is using the CPU.")
    except Exception as e:
        print(f"Error loading Whisper model: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Checking GPU usage for Whisper model...")
    check_gpu_usage()