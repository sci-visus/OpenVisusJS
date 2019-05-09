
import sys
import os
import numpy as np
from lxml import etree
import ntpath
import struct


def conv_to_visus(filepath):
  print "parse", filepath
  xmldoc = etree.parse(filepath)

  x=[]
  r=[]
  g=[]
  b=[]

  rgba=""
  count=0
  for s in xmldoc.getroot().findall('.//Point'):
    x.append(float(s.attrib['x']))
    r.append(float(s.attrib['r']))
    g.append(float(s.attrib['g']))
    b.append(float(s.attrib['b']))
    count = count+1

  print "x\n", x, "\n\n"
  print "r\n", r, "\n\n"
  print "g\n", g, "\n\n"
  print "b\n", b, "\n\n"

  print "\n\n\nnumber of elems", count

def float_to_hex(f):
    return str(hex(struct.unpack('<I', struct.pack('<f', f))[0]))

def split_hex(x):
  if(x=="0x0"):
    x_s="0x0,0x0,0x0,0x0"
  else:
    x_s=x[:4]+",0x"+x[4:6]+",0x"+x[6:8]+",0x"+x[8:10]

  return x_s

def get_var(filepath, name):
  ## load source xml file
  print "parse", filepath
  xmldoc = etree.parse(filepath)

  data_vals=[]
  color_vals=[]

  rgba=""
  for s in xmldoc.getroot().findall('.//Point'):
    data_vals.append(float(s.attrib['x'])*255)
    color_vals.append((float(s.attrib['r'])*255,float(s.attrib['g'])*255,float(s.attrib['b'])*255))

    x=float(s.attrib['x'])*255#float_to_hex(float(s.attrib['x'])*255)
    r=float(s.attrib['r'])*255#float_to_hex(float(s.attrib['r'])*255)
    g=float(s.attrib['g'])*255#float_to_hex(float(s.attrib['g'])*255)
    b=float(s.attrib['b'])*255#float_to_hex(float(s.attrib['b'])*255)

    # x_s=split_hex(x)
    # r_s=split_hex(r)
    # g_s=split_hex(g)
    # b_s=split_hex(b)

    rgba+="  "+str(r)+","+str(g)+","+str(b)+","+str(x)+",\n"#+s.attrib['o']+",\n"

  variable="const "+name+"=[\n"+rgba[:-2]+"]\n"
  
  return variable

def get_option_tag(name):
  return "<option value='"+name+"'>"+name+"</option>"

def get_if_palette(name):
  return "else if (palette_str == '"+name+"')\ncolormap="+name+";"

out = open("additional_palette.js", "wb")


# conv_to_visus("xml/magic_colormap.xml")

# exit(0)


for fn in os.listdir(sys.argv[1]):
  filepath = sys.argv[1]+"/"+fn
  basename = ntpath.basename(filepath)
  name = "scivis_"+basename.split('.')[0]

  name = name.replace("-","_")
  var = get_var(filepath, name)
  out.write(var+"\n")

  # option=get_option_tag(name)
  # out.write(option+"\n")
  
  # option=get_if_palette(name)
  # out.write(option+"\n")

out.close()
#print color_vals

print 'converted successfully!'

