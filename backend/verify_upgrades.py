import os
import sys
import asyncio
from main import app, manager, logger

def test_production_upgrades():
    print("====================================================")
    print("    SmartAQI Production Upgrades Verification     ")
    print("====================================================\n")

    # 1. Verify Logging
    print("Step 1: Checking Production Logging Configuration...")
    logger.info("Test log message for SmartAQI upgrades verification.")
    
    if os.path.exists("app.log"):
        print("✅ Success: Production log file 'app.log' created.")
        with open("app.log", "r") as f:
            log_content = f.read()
            if "Test log message" in log_content:
                print("✅ Success: Log entry successfully written to file.")
            else:
                print("❌ Failure: Log entry not found in 'app.log'.")
                sys.exit(1)
    else:
        print("❌ Failure: Log file 'app.log' was not created.")
        sys.exit(1)
    print("")

    # 2. Verify WebSocket Connection Manager
    print("Step 2: Checking WebSocket Connection Manager...")
    if not hasattr(manager, "active_connections") or not hasattr(manager, "broadcast"):
        print("❌ Failure: WebSocket ConnectionManager missing required attributes.")
        sys.exit(1)
    print(f"✅ Success: ConnectionManager initialized. Active connections: {len(manager.active_connections)}")
    print("")

    # 3. Test Mock Broadcast
    print("Step 3: Simulating Asynchronous Broadcast...")
    try:
        # Run async broadcast in dummy loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If verify script is executed under active loop
            task = loop.create_task(manager.broadcast({
                "type": "test",
                "data": {"status": "success", "message": "Verify upgrades run"}
            }))
        else:
            loop.run_until_complete(manager.broadcast({
                "type": "test",
                "data": {"status": "success", "message": "Verify upgrades run"}
            }))
        print("✅ Success: Simulated WebSocket broadcast completed successfully.")
    except Exception as e:
        print(f"❌ Failure during async broadcast test: {e}")
        sys.exit(1)
    print("")

    print("====================================================")
    print("      UPGRADES VERIFIED: ALL CHECKS PASSED          ")
    print("====================================================")

if __name__ == "__main__":
    test_production_upgrades()
