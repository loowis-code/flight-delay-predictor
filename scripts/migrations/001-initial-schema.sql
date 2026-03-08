-- Aggregated historical delay stats from Eurocontrol
CREATE TABLE route_delay_stats (
    id SERIAL PRIMARY KEY,
    airline_icao VARCHAR(4) NOT NULL,
    origin_icao VARCHAR(4) NOT NULL,
    destination_icao VARCHAR(4) NOT NULL,
    month SMALLINT NOT NULL,
    day_of_week SMALLINT NOT NULL,
    time_bucket VARCHAR(10) NOT NULL,
    total_flights INT NOT NULL,
    delayed_flights INT NOT NULL,
    avg_delay_minutes NUMERIC(6,2),
    p50_delay_minutes NUMERIC(6,2),
    p90_delay_minutes NUMERIC(6,2),
    cancelled_flights INT DEFAULT 0,
    data_year SMALLINT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(airline_icao, origin_icao, destination_icao, month, day_of_week, time_bucket, data_year)
);

CREATE INDEX idx_route_lookup ON route_delay_stats(airline_icao, origin_icao, destination_icao);
CREATE INDEX idx_airport_origin ON route_delay_stats(origin_icao);
CREATE INDEX idx_airport_dest ON route_delay_stats(destination_icao);

-- Airport reference data
CREATE TABLE airports (
    icao VARCHAR(4) PRIMARY KEY,
    iata VARCHAR(3) UNIQUE,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    timezone VARCHAR(50)
);

-- Cache AviationStack lookups to minimize API calls
CREATE TABLE flight_lookup_cache (
    flight_number VARCHAR(10) NOT NULL,
    lookup_date DATE NOT NULL,
    airline_icao VARCHAR(4),
    airline_name VARCHAR(100),
    origin_icao VARCHAR(4),
    origin_iata VARCHAR(3),
    destination_icao VARCHAR(4),
    destination_iata VARCHAR(3),
    scheduled_departure TIMESTAMP,
    scheduled_arrival TIMESTAMP,
    raw_response JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY(flight_number, lookup_date)
);
