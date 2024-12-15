from app import app as application
import os

app = application

if __name__ == "__main__":
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Run app on 0.0.0.0 to make it accessible
    app.run(host='0.0.0.0', port=port, debug=True)
