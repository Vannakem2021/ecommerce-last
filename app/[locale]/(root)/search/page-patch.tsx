          <div className='grid grid-cols-1 gap-4 md:grid-cols-2  lg:grid-cols-3  '>
            {data.products.length === 0 && (
              <div className='col-span-full'>
                {tag === 'todays-deal' ? (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='text-6xl mb-4'>⚡</div>
                    <h3 className='text-2xl font-bold mb-2'>No Flash Deals Right Now</h3>
                    <p className='text-muted-foreground text-center max-w-md'>
                      Check back soon for amazing limited-time deals!
                    </p>
                  </div>
                ) : (
                  <div>{t('Search.No product found')}</div>
                )}
              </div>
            )}
            {data.products.map((product: IProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
