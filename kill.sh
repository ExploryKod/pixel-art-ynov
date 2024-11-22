#!/bin/bash

# Function to print usage instructions
print_usage() {
    echo "Usage: $0 <port_number>"
    echo "Kills the process using the specified port"
}

# Check if a port number was provided
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

PORT=$1

# Check if the input is a valid number
if ! [[ $PORT =~ ^[0-9]+$ ]]; then
    echo "Error: Port number must be a positive integer"
    exit 1
fi

# Check if the port is within valid range (0-65535)
if [ $PORT -lt 0 ] || [ $PORT -gt 65535 ]; then
    echo "Error: Port number must be between 0 and 65535"
    exit 1
fi

# Find the PID of the process using the specified port
echo "Running lsof command:"
PID=$(sudo lsof -nP -i:$PORT | awk '/LISTEN/{print $2}' | head -n 1)
echo "$PID"

# Check if a PID was found
if [ -z "$PID" ]; then
    echo "No process found listening on port $PORT"
    exit 0
fi

# Attempt to kill the process
echo "Running kill command:"
sudo kill -9 $PID
echo "$?"

# Check if the kill was successful
if [ $? -eq 0 ]; then
    echo "Successfully killed process with PID $PID listening on port $PORT"
else
    echo "Error killing process with PID $PID"
fi

