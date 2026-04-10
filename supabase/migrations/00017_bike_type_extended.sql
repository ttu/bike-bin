-- Additional bike_type values (cyclocross, MTB disciplines, BMX, fat bike)
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'cyclo';
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'enduro';
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'xc';
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'downhill';
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'bmx';
ALTER TYPE bike_type ADD VALUE IF NOT EXISTS 'fatbike';
