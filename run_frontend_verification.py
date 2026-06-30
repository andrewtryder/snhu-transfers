import sys
import os

# Add the current directory to sys.path to resolve imports if necessary
sys.path.append(os.getcwd())

def complete_verification():
    from agents.tools.frontend_verification_complete import frontend_verification_complete
    frontend_verification_complete(
        screenshot_path='/home/jules/verification/screenshots/verification.png',
        additional_media_paths=['/home/jules/verification/videos/8a4d1378238a4530dda65b6de52784c0.webm']
    )

if __name__ == '__main__':
    complete_verification()
