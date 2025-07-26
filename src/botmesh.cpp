#include "pxt.h"
#include <cstdint>
#include <math.h>

using namespace pxt;

namespace botmesh {

    /* Scramble the input using MurmurHash3. This can sccrmable the bits of the 
    * id of the Micro:bit, so we can use the last 12 for an id value. */
   //%
   uint32_t murmur_32_scramble(uint32_t k) {
        k *= 0xcc9e2d51;
        k = (k << 15) | (k >> 17);  // rotate left 15
        k *= 0x1b873593;
        return k;
    }

}
