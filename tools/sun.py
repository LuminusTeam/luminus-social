"""Soluppgång/solnedgång och skymning (NOAA-algoritm). sun(lat,lon,date,tz_hours) -> dict med lokala tider."""
import math, datetime as dt
def _calc(lat,lon,d,zenith,rising):
    N=d.timetuple().tm_yday; lh=lon/15
    t=N+((6 if rising else 18)-lh)/24
    M=0.9856*t-3.289
    L=(M+1.916*math.sin(math.radians(M))+0.020*math.sin(math.radians(2*M))+282.634)%360
    RA=math.degrees(math.atan(0.91764*math.tan(math.radians(L))))%360
    RA=(RA+(math.floor(L/90)*90-math.floor(RA/90)*90))/15
    sd=0.39782*math.sin(math.radians(L)); cd=math.cos(math.asin(sd))
    ch=(math.cos(math.radians(zenith))-sd*math.sin(math.radians(lat)))/(cd*math.cos(math.radians(lat)))
    if ch>1 or ch<-1: return None
    H=(360-math.degrees(math.acos(ch))) if rising else math.degrees(math.acos(ch))
    T=H/15+RA-0.06571*t-6.622
    return (T-lh)%24
def sun(lat,lon,d,tz):
    f=lambda h: None if h is None else (dt.datetime.combine(d,dt.time())+dt.timedelta(hours=(h+tz)%24)).strftime('%H:%M')
    return {'upp':f(_calc(lat,lon,d,90.833,True)),'ned':f(_calc(lat,lon,d,90.833,False)),'skymning_slut':f(_calc(lat,lon,d,96,False)),'gryning':f(_calc(lat,lon,d,96,True))}
if __name__=='__main__':
    for d in (dt.date(2026,10,31),dt.date(2026,11,1),dt.date(2026,11,2)):
        print(d, 'Uppsala',sun(59.86,17.64,d,1),'Enköping',sun(59.64,17.08,d,1),'Västerås',sun(59.61,16.55,d,1),'Sala',sun(59.92,16.61,d,1))
