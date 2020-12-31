export function is_colliding(a, b) {
    const axscale = a[0][0]
    const ayscale = a[1][1]
    const azscale = a[2][2]
    const axtrans = a[0][3]/axscale
    const aytrans = a[1][3]/ayscale
    const aztrans = a[2][3]/azscale

    const bxscale = b[0][0]
    const byscale = b[1][1]
    const bzscale = b[2][2]
    const bxtrans = b[0][3]/bxscale
    const bytrans = b[1][3]/byscale
    const bztrans = b[2][3]/bzscale

    const minax = (-1 + axtrans) * axscale
    const minay = (-1 + aytrans) * ayscale
    const minaz = (-1 + aztrans) * azscale
    const maxax = (1 + axtrans) * axscale
    const maxay = (1 + aytrans) * ayscale
    const maxaz = (1 + aztrans) * azscale

    const minbx = (-1 + bxtrans) * bxscale
    const minby = (-1 + bytrans) * byscale
    const minbz = (-1 + bztrans) * bzscale
    const maxbx = (1 + bxtrans) * bxscale
    const maxby = (1 + bytrans) * byscale
    const maxbz = (1 + bztrans) * bzscale

    return (minax <= maxbx && maxax >= minbx) &&
        (minay <= maxby && maxay >= minby) &&
        (minaz <= maxbz && maxaz >= minbz);
}